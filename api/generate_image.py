import os
import json
import base64
from io import BytesIO
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Impor Vertex AI
import vertexai
from vertexai.vision_models import ImageGenerationModel

# --- KONFIGURASI ---
# Ambil Project ID dan Location dari Environment Variables Vercel
# Pastikan Anda sudah mengatur ini di Vercel Environment Variables jika berbeda
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "your-google-cloud-project-id") # Ganti dengan ID proyek Anda
LOCATION = os.environ.get("GCP_LOCATION", "us-central1") # Ganti dengan region Anda

# Inisialisasi Vertex AI dan Model Imagen secara global
# agar tidak diinisialisasi ulang setiap kali fungsi dipanggil (cold start optimization)
imagen_model = None
try:
    # Load kredensial dari environment variable (string JSON)
    creds_json_string = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if creds_json_string:
        # Tulis string JSON ke file sementara (dibutuhkan oleh vertexai.init)
        # Dalam lingkungan serverless, /tmp bisa digunakan
        creds_file_path = "/tmp/service_account_key.json"
        with open(creds_file_path, "w") as f:
            f.write(creds_json_string)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_file_path
        print("Kredensial layanan akun berhasil dimuat dari environment variable.")
    else:
        print("Peringatan: Variabel lingkungan GOOGLE_APPLICATION_CREDENTIALS_JSON tidak ditemukan.")

    vertexai.init(project=PROJECT_ID, location=LOCATION)
    imagen_model = ImageGenerationModel.from_pretrained("imagegeneration@006")
    print("Vertex AI dan Imagen Model berhasil diinisialisasi di Vercel.")
except Exception as e:
    print(f"ERROR saat inisialisasi Vertex AI atau Imagen Model: {e}")
    # Jika inisialisasi gagal, model akan tetap None, dan akan ditangani di handler

# --- SERVERLESS FUNCTION HANDLER ---
# Fungsi ini akan dipanggil oleh Vercel ketika endpoint diakses
def handler(request, response):
    if request.method == 'POST':
        try:
            # Baca body request JSON
            body = json.loads(request.body)
            prompt = body.get('prompt')

            if not prompt:
                response.status(400)
                response.json({"error": "Prompt is required"})
                return

            if not imagen_model:
                response.status(500)
                response.json({"error": "AI image model not initialized. Check server logs."})
                return

            print(f"Menerima permintaan generasi gambar dengan prompt: '{prompt}'")
            images = imagen_model.generate_images(
                prompt=prompt,
                number_of_images=1,
                aspect_ratio="1:1" # Bisa disesuaikan
            )

            if images:
                # Mengembalikan gambar sebagai Base64 Data URL
                img_byte_arr = BytesIO()
                images[0].save(img_byte_arr, format='PNG')
                img_byte_arr = img_byte_arr.getvalue()
                base64_image = base64.b64encode(img_byte_arr).decode('utf-8')
                image_data_url = f"data:image/png;base64,{base64_image}"

                response.status(200)
                response.json({"success": True, "image_data_url": image_data_url})
            else:
                response.status(500)
                response.json({"success": False, "error": "Tidak ada gambar yang dihasilkan oleh Imagen."})

        except json.JSONDecodeError:
            response.status(400)
            response.json({"error": "Invalid JSON in request body"})
        except Exception as e:
            print(f"ERROR dalam fungsi generate_image: {e}")
            response.status(500)
            response.json({"success": False, "error": f"Internal server error: {str(e)}"})
    else:
        response.status(405) # Method Not Allowed
        response.json({"error": "Method Not Allowed. Use POST."})

# Ini adalah kelas pembantu untuk mengadaptasi request/response Vercel ke handler sederhana
# Anda tidak perlu mengubah ini kecuali Anda ingin menggunakannya dengan framework seperti Flask/FastAPI
# yang membutuhkan struktur WSGI/ASGI. Untuk Vercel serverless Python,
# fungsi 'handler' di atas lebih langsung.
# Jika Anda ingin menggunakan framework, Anda perlu membuat file vercel.json.
# Namun, untuk fungsi tunggal, struktur ini cukup.

# Catatan: Vercel secara internal akan memetakan permintaan HTTP ke fungsi handler.
# Kode ini disederhanakan untuk menunjukkan inti logika serverless.
# Untuk Vercel, biasanya Anda hanya mengekspor fungsi `handler` jika menggunakan Vercel's
# Native Serverless Functions.

# Untuk menyimulasikan lingkungan Vercel, kita perlu sedikit boilerplate
# yang Vercel lakukan di balik layar.
# Dalam Vercel, ini adalah bagaimana request.body, request.method dll. akan diakses.

# Karena Vercel secara otomatis memanggil fungsi Python di `api/` dengan `request` dan `response` objects,
# kita akan sedikit menyesuaikan boilerplate untuk mencocokkan.

# Untuk Vercel, Python Serverless Function dieksekusi sebagai WSGI app atau raw function.
# Struktur sederhana yang diterima Vercel adalah:
# `from http.server import BaseHTTPRequestHandler`
# `class Handler(BaseHTTPRequestHandler):`
#    `def do_POST(self):`
#        `# logic here`
# Ini adalah struktur yang lebih formal untuk Vercel.

# --- Boilerplate Vercel (untuk deploy) ---
# Ini adalah cara yang Vercel harapkan untuk fungsi Python.
class RequestHandler(BaseHTTPRequestHandler):
    def _send_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*') # Penting untuk CORS
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        self.request_body = self.rfile.read(content_length)

        # Buat objek response sederhana untuk dilewatkan ke handler asli
        class SimpleResponse:
            def __init__(self, handler_instance):
                self._handler = handler_instance
                self.status_code = 200
                self._json_data = None

            def status(self, code):
                self.status_code = code
                return self

            def json(self, data):
                self._json_data = data
                self._handler._send_response(self.status_code, self._json_data)

        simple_response = SimpleResponse(self)

        # Panggil handler utama
        handler(self, simple_response)

    def do_OPTIONS(self): # Handler untuk pre-flight CORS requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Vercel akan secara otomatis menemukan kelas RequestHandler ini
# jika ada di dalam folder 'api'.
