from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from .mongodb_utils import create_user, authenticate_user, get_user_by_username, get_ticket_stats
import qrcode
import base64
from io import BytesIO
import zipfile
import uuid
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from functools import wraps


def login_required_custom(view_func):
    """
    Decorator to require login for views.
    Redirects to login page if user is not authenticated.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.session.get('user_id'):
            return redirect('/login/')
        return view_func(request, *args, **kwargs)
    return wrapper


def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def generate_ticket_image(ticket_id, design_config=None):
    """
    Generate a classy LANDSCAPE ticket image with custom design using Pillow.
    Returns base64 encoded image and PIL Image object.
    """
    # Default design if none provided
    if not design_config:
        design_config = {
            'event_name': 'EVENT PASS',
            'ticket_type': 'entry',
            'price': 0,
            'primary_color': '#2563eb',
            'secondary_color': '#1e40af',
            'background_style': 'gradient'
        }
    
    # Ticket dimensions - LANDSCAPE (wider than tall)
    width, height = 800, 350
    
    # Create base image with colored background
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)
    
    # Parse colors
    primary_rgb = hex_to_rgb(design_config['primary_color'])
    secondary_rgb = hex_to_rgb(design_config['secondary_color'])
    
    # Create full background gradient
    if design_config['background_style'] == 'gradient':
        for x in range(width):
            ratio = x / width
            r = int(primary_rgb[0] * (1 - ratio) + secondary_rgb[0] * ratio)
            g = int(primary_rgb[1] * (1 - ratio) + secondary_rgb[1] * ratio)
            b = int(primary_rgb[2] * (1 - ratio) + secondary_rgb[2] * ratio)
            draw.rectangle([(x, 0), (x + 1, height)], fill=(r, g, b))
    else:
        draw.rectangle([(0, 0), (width, height)], fill=primary_rgb)
    
    # Add subtle decorative circles pattern (very light)
    for i in range(0, width, 100):
        for j in range(0, height, 100):
            # Draw semi-transparent circles
            overlay = Image.new('RGBA', (width, height), (255, 255, 255, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.ellipse([(i-25, j-25), (i+25, j+25)], fill=(255, 255, 255, 15))
            img.paste(overlay, (0, 0), overlay)
    
    # Add very subtle diagonal accent lines (minimal)
    overlay = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    for i in range(-height, width, 120):
        overlay_draw.line([(i, 0), (i + height, height)], fill=(255, 255, 255, 8), width=2)
    img.paste(overlay, (0, 0), overlay)
    
    # Try to load fonts
    try:
        title_font = ImageFont.truetype("arial.ttf", 48)
        subtitle_font = ImageFont.truetype("arial.ttf", 28)
        info_font = ImageFont.truetype("arial.ttf", 20)
        small_font = ImageFont.truetype("arial.ttf", 14)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        info_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # LEFT SECTION - Event Information
    left_margin = 40
    
    # Event name (top left)
    event_name = design_config['event_name']
    draw.text((left_margin, 50), event_name.upper(), 
              fill='white', font=title_font)
    
    # Ticket type and price (below event name)
    if design_config['ticket_type'] == 'paid':
        price_text = f"PAID ENTRY | ₹{design_config['price']}"
    else:
        price_text = "FREE ENTRY"
    
    draw.text((left_margin, 120), price_text, 
              fill='white', font=subtitle_font)
    
    # Ticket ID (bottom left)
    id_text = f"TICKET ID: {str(ticket_id)[:8].upper()}"
    draw.text((left_margin, height - 80), id_text, 
              fill='white', font=info_font)
    
    # Admit One text
    draw.text((left_margin, height - 50), "ADMIT ONE", 
              fill='white', font=small_font)
    
    # RIGHT SECTION - QR Code (large, centered right half for easy scanning)
    qr = qrcode.QRCode(box_size=10, border=3, error_correction=qrcode.constants.ERROR_CORRECT_H)
    qr.add_data(str(ticket_id))
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Resize QR code – make it tall enough to fill most of the right panel
    qr_size = 220
    qr_img = qr_img.resize((qr_size, qr_size), resample=0)

    # Center QR vertically within the right section, with margin from edge
    qr_x = width - qr_size - 20
    qr_y = (height - qr_size) // 2
    
    # Add white rounded background for QR code
    qr_bg_padding = 15
    qr_bg_rect = [
        qr_x - qr_bg_padding,
        qr_y - qr_bg_padding,
        qr_x + qr_size + qr_bg_padding,
        qr_y + qr_size + qr_bg_padding
    ]
    draw.rounded_rectangle(qr_bg_rect, radius=15, fill='white')
    
    # Paste QR code
    img.paste(qr_img, (qr_x, qr_y))
    
    # Add "SCAN HERE" text above QR
    scan_text = "SCAN HERE"
    bbox = draw.textbbox((0, 0), scan_text, font=small_font)
    text_width = bbox[2] - bbox[0]
    draw.text((qr_x + (qr_size - text_width) // 2, qr_y - 25), 
              scan_text, fill='white', font=small_font)
    
    # Add decorative corner elements
    corner_size = 30
    corner_color = (255, 255, 255, 100)
    
    # Top left corner
    draw.rectangle([(0, 0), (corner_size, 5)], fill=corner_color)
    draw.rectangle([(0, 0), (5, corner_size)], fill=corner_color)
    
    # Top right corner
    draw.rectangle([(width - corner_size, 0), (width, 5)], fill=corner_color)
    draw.rectangle([(width - 5, 0), (width, corner_size)], fill=corner_color)
    
    # Bottom left corner
    draw.rectangle([(0, height - 5), (corner_size, height)], fill=corner_color)
    draw.rectangle([(0, height - corner_size), (5, height)], fill=corner_color)
    
    # Convert to base64 for HTML display
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str, img

# --- DESIGN CONFIGURATOR ---
def design_configurator(request):
    """Render the design configuration page."""
    design = request.session.get('ticket_design', {})
    return render(request, 'design_configurator.html', {'design': design})

def save_design(request):
    """Save ticket design configuration to session."""
    if request.method == 'POST':
        design_config = {
            'event_name': request.POST.get('event_name', 'My Event'),
            'ticket_type': request.POST.get('ticket_type', 'entry'),
            'price': int(request.POST.get('price', 0)),
            'primary_color': request.POST.get('primary_color', '#2563eb'),
            'secondary_color': request.POST.get('secondary_color', '#1e40af'),
            'background_style': request.POST.get('background_style', 'gradient'),
        }
        request.session['ticket_design'] = design_config
        return redirect('/generate/')
    return redirect('/design/')

# --- GENERATOR SECTION ---
def generate_tickets(request):
    """
    Generates N tickets with custom design and displays them for printing/distribution.
    Run this BEFORE the event.
    """
    tickets_to_show = []
    design_config = request.session.get('ticket_design', None)
    
    if request.method == "POST":
        count = int(request.POST.get('count', 5))
        ticket_ids = []
        from .mongodb_utils import get_tickets_collection
        tickets_collection = get_tickets_collection()

        for _ in range(count):
            ticket_id = str(uuid.uuid4())
            tickets_collection.insert_one({
                'ticket_id': ticket_id,
                'is_used': False,
                'scanned_at': None,
                'created_at': datetime.utcnow(),
            })
            ticket_ids.append(ticket_id)
            img_str, _ = generate_ticket_image(ticket_id, design_config)
            tickets_to_show.append({'id': ticket_id, 'qr_image': img_str})

        # Store ticket IDs in session for download
        request.session['last_generated_tickets'] = ticket_ids

    return render(request, 'generate.html', {
        'tickets': tickets_to_show,
        'design': design_config
    })

def download_tickets_zip(request):
    """
    Downloads the last generated tickets as a ZIP file with custom design.
    """
    ticket_ids = request.session.get('last_generated_tickets', [])
    design_config = request.session.get('ticket_design', None)
    
    if not ticket_ids:
        return HttpResponse("No tickets to download. Please generate tickets first.", status=400)
    
    # Create ZIP file in memory
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for ticket_id in ticket_ids:
            # Generate custom ticket image
            _, img = generate_ticket_image(ticket_id, design_config)
            
            # Save to buffer
            img_buffer = BytesIO()
            img.save(img_buffer, format="PNG")
            img_buffer.seek(0)
            
            # Add to ZIP with filename
            zip_file.writestr(f'ticket_{ticket_id[:8]}.png', img_buffer.getvalue())
    
    # Prepare response
    zip_buffer.seek(0)
    response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
    response['Content-Disposition'] = 'attachment; filename="event_tickets.zip"'
    
    return response

def landing_page(request):
    """
    Landing page redirects to dashboard if logged in, otherwise to login.
    """
    if request.session.get('user_id'):
        return redirect('/dashboard/')
    else:
        return redirect('/login/')

# --- GATE SCANNER SECTION ---
def gate_scanner(request):
    """Renders the webcam scanning page."""
    return render(request, 'scanner.html')

@csrf_exempt
def validate_ticket_api(request):
    """
    Validate a scanned QR code ticket.
    Accepts both JSON body (Next.js) and form POST (original Django scanner).
    Reads/writes tickets in MongoDB (same store as api_generate).
    """
    if request.method != "POST":
        return JsonResponse({'status': 'error', 'message': 'Bad Request'})

    # Support both JSON body (Next.js) and form-encoded (original Django template)
    scanned_code = None
    content_type = request.content_type or ''
    if 'application/json' in content_type:
        import json as _json
        try:
            body = _json.loads(request.body)
            scanned_code = body.get('code')
        except Exception:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    else:
        scanned_code = request.POST.get('code')

    if not scanned_code:
        return JsonResponse({'status': 'error', 'message': 'No ticket code provided'})

    from .mongodb_utils import get_tickets_collection
    tickets = get_tickets_collection()

    ticket = tickets.find_one({'ticket_id': scanned_code})

    if not ticket:
        return JsonResponse({'status': 'error', 'message': 'INVALID TICKET'})

    if ticket.get('is_used'):
        scan_time = str(ticket.get('scanned_at', ''))
        return JsonResponse({
            'status': 'error',
            'message': 'ALREADY USED!',
            'time': scan_time,
        })

    # Mark as used
    from datetime import datetime
    now = datetime.utcnow()
    tickets.update_one(
        {'ticket_id': scanned_code},
        {'$set': {'is_used': True, 'scanned_at': now}}
    )
    return JsonResponse({'status': 'success', 'message': 'ENTRY GRANTED ✅'})


# --- AUTHENTICATION SECTION ---
def register_view(request):
    """
    User registration page. Creates new user accounts.
    """
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        confirm_password = request.POST.get('confirm_password', '')
        
        # Validation
        if not username or not password:
            messages.error(request, 'Username and password are required.')
            return render(request, 'register.html')
        
        if len(username) < 3:
            messages.error(request, 'Username must be at least 3 characters long.')
            return render(request, 'register.html')
        
        if len(password) < 6:
            messages.error(request, 'Password must be at least 6 characters long.')
            return render(request, 'register.html')
        
        if password != confirm_password:
            messages.error(request, 'Passwords do not match.')
            return render(request, 'register.html')
        
        # Try to create user
        if create_user(username, password):
            messages.success(request, f'Account created successfully! You can now log in.')
            return redirect('/login/')
        else:
            messages.error(request, 'Username already exists. Please choose a different one.')
            return render(request, 'register.html')
    
    return render(request, 'register.html')


def login_view(request):
    """
    User login page. Authenticates users and creates session.
    """
    # If already logged in, redirect to dashboard
    if request.session.get('user_id'):
        return redirect('/dashboard/')
    
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        
        if not username or not password:
            messages.error(request, 'Username and password are required.')
            return render(request, 'login.html')
        
        # Authenticate user
        user = authenticate_user(username, password)
        
        if user:
            # Create session
            request.session['user_id'] = str(user['_id'])
            request.session['username'] = user['username']
            messages.success(request, f'Welcome back, {user["username"]}!')
            return redirect('/dashboard/')
        else:
            messages.error(request, 'Invalid username or password.')
            return render(request, 'login.html')
    
    return render(request, 'login.html')


def logout_view(request):
    """
    Logs out the user by clearing the session.
    """
    request.session.flush()
    messages.success(request, 'You have been logged out successfully.')
    return redirect('/login/')


@login_required_custom
def dashboard_view(request):
    """
    Protected dashboard accessible only to logged-in users.
    """
    username = request.session.get('username', 'User')
    
    # Get user stats using direct MongoDB queries (avoiding djongo compatibility issues)
    stats = get_ticket_stats()
    
    context = {
        'username': username,
        'total_tickets': stats['total'],
        'used_tickets': stats['used'],
        'available_tickets': stats['available'],
    }
    
    return render(request, 'dashboard.html', context)


# ============================================================
#  JSON API VIEWS – consumed by Next.js frontend
# ============================================================

@csrf_exempt
def api_login(request):
    """JSON API: authenticate and start session."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    import json
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return JsonResponse({'status': 'error', 'message': 'Username and password are required.'})

    user = authenticate_user(username, password)
    if user:
        request.session['user_id'] = str(user['_id'])
        request.session['username'] = user['username']
        return JsonResponse({'status': 'success', 'username': user['username'], 'user_id': str(user['_id'])})
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid username or password.'})


@csrf_exempt
def api_register(request):
    """JSON API: create a new user account."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    import json
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    username = data.get('username', '').strip()
    password = data.get('password', '')
    confirm  = data.get('confirm_password', '')

    if not username or not password:
        return JsonResponse({'status': 'error', 'message': 'Username and password are required.'})
    if len(username) < 3:
        return JsonResponse({'status': 'error', 'message': 'Username must be at least 3 characters.'})
    if len(password) < 6:
        return JsonResponse({'status': 'error', 'message': 'Password must be at least 6 characters.'})
    if password != confirm:
        return JsonResponse({'status': 'error', 'message': 'Passwords do not match.'})

    if create_user(username, password):
        return JsonResponse({'status': 'success', 'message': 'Account created successfully.'})
    else:
        return JsonResponse({'status': 'error', 'message': 'Username already exists.'})


@csrf_exempt
def api_logout(request):
    """JSON API: destroy session."""
    request.session.flush()
    return JsonResponse({'status': 'success', 'message': 'Logged out.'})


@csrf_exempt
def api_dashboard(request):
    """JSON API: return ticket stats for the dashboard."""
    # Session cookie auth doesn't work cross-origin in dev;
    # access is guarded on the Next.js side via localStorage.
    stats = get_ticket_stats()
    return JsonResponse({
        'total_tickets': stats['total'],
        'used_tickets':  stats['used'],
        'available_tickets': stats['available'],
    })


@csrf_exempt
def api_save_design(request):
    """JSON API: save ticket design to session."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    import json
    try:
        design_config = json.loads(request.body)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    request.session['ticket_design'] = design_config
    return JsonResponse({'status': 'success'})


@csrf_exempt
def api_generate(request):
    """JSON API: generate N tickets and return base64 images (stores in MongoDB)."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    # Session cookie auth doesn't work cross-origin in dev;
    # access is guarded on the Next.js side via localStorage.
    import json
    from datetime import datetime
    from .mongodb_utils import get_tickets_collection

    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    count         = min(int(body.get('count', 5)), 100)
    design_config = body.get('design') or {}

    tickets_collection = get_tickets_collection()
    tickets_out = []
    ticket_ids  = []

    for _ in range(count):
        import uuid
        ticket_id = str(uuid.uuid4())

        # Save directly to MongoDB (same collection that get_ticket_stats reads from)
        tickets_collection.insert_one({
            'ticket_id': ticket_id,
            'is_used':   False,
            'scanned_at': None,
            'created_at': datetime.utcnow(),
        })

        ticket_ids.append(ticket_id)
        img_str, _ = generate_ticket_image(ticket_id, design_config)
        tickets_out.append({'id': ticket_id, 'qr_image': img_str})

    return JsonResponse({'tickets': tickets_out})


@csrf_exempt
def api_download_tickets(request):
    """JSON API: download tickets as a ZIP."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    import json
    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    ticket_ids    = body.get('ticket_ids') or request.session.get('last_generated_tickets', [])
    design_config = body.get('design') or request.session.get('ticket_design')

    if not ticket_ids:
        return HttpResponse('No tickets to download.', status=400)

    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for tid in ticket_ids:
            _, img = generate_ticket_image(tid, design_config)
            img_buf = BytesIO()
            img.save(img_buf, format='PNG')
            zf.writestr(f'ticket_{tid[:8]}.png', img_buf.getvalue())

    zip_buffer.seek(0)
    response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
    response['Content-Disposition'] = 'attachment; filename="event_tickets.zip"'
    return response
