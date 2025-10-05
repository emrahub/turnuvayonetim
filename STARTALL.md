# TURNUVAYONETIM - Proje Başlatma Kılavuzu

## ✅ ÇALIŞAN YÖNTEM (Claude Code ile)

### Servisleri başlatmak için aşağıdaki komutları sırayla çalıştırın:

```bash
# 1. WebSocket Server (Port 3003)
cd apps/ws && set WS_PORT=3003 && npm run dev
# Background modda çalıştır

# 2. Backend API (Port 4000)
cd apps/backend && set API_PORT=4000 && set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament && npm run dev
# Background modda çalıştır

# 3. Frontend (Port 3005)
cd apps/web && set PORT=3005 && set NEXT_PUBLIC_APP_URL=http://localhost:3005 && npm run dev
# Background modda çalıştır
```

### Claude Code'a söylemeniz gereken:
```
Şu 3 komutu background modda çalıştır:
1. cd apps/ws && set WS_PORT=3003 && npm run dev
2. cd apps/backend && set API_PORT=4000 && set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tournament && npm run dev
3. cd apps/web && set PORT=3005 && set NEXT_PUBLIC_APP_URL=http://localhost:3005 && npm run dev
```

## ❌ NEDEN START-ALL.BAT ÇALIŞMIYOR?

START-ALL.bat dosyası `start` komutuyla yeni CMD pencereleri açıyor:
```batch
start "TURNUVA - WebSocket (3003)" cmd /k "cd /d %~dp0apps\ws && ..."
```

Bu pencereler açılıp hemen kapanıyor çünkü:
- `cmd /k` komutu yeni bir pencere açar
- Bash environment'ı Windows CMD ile uyumlu çalışmıyor
- Process'ler başlamadan pencere kapanıyor

## 🔧 SORUN GİDERME

### Portları temizlemek için:
```bash
# Tüm Node process'lerini kapat
tasklist | findstr "node"
taskkill /F /IM node.exe

# Veya belirli portları temizle
netstat -ano | findstr :3005
netstat -ano | findstr :4000
netstat -ano | findstr :3003
```

### Servislerin çalışıp çalışmadığını kontrol etmek için:
```bash
netstat -ano | findstr :3005
netstat -ano | findstr :4000
netstat -ano | findstr :3003
```

## 📋 PORTLAR

- **Frontend (Next.js)**: 3005
- **Backend API (tRPC)**: 4000
- **WebSocket Server**: 3003
- **PostgreSQL**: 5432
- **Redis**: 6379

## 🚀 ERİŞİM ADRESLERİ

- Frontend: http://localhost:3005
- Backend API: http://localhost:4000/trpc
- WebSocket: ws://localhost:3003

## 💡 ÖNEMLİ NOTLAR

1. **Servisleri her zaman background modda çalıştırın** - Bu sayede terminal bloke olmaz
2. **Sırayla başlatın** - WebSocket → Backend → Frontend
3. **Her servis için 3-5 saniye bekleyin** - Başlatma süresi gerekli
4. **Environment variable'lar önemli** - WS_PORT, API_PORT, DATABASE_URL vs. mutlaka set edilmeli
5. **Hata durumunda portları temizleyin** - taskkill ile node process'lerini öldürün

## 🔄 HIZLI YENİDEN BAŞLATMA

```bash
# Önce tüm Node process'lerini kapat
taskkill /F /IM node.exe

# Sonra 3 komutu background modda çalıştır (yukarıda belirtildiği gibi)
```

## 📝 BASH vs CMD FARKI

- **Bash tool (Claude Code)**: `run_in_background: true` ile arka planda çalıştırır ✅
- **CMD start komutu**: Yeni pencere açar ama hemen kapanır ❌
- **PowerShell**: Bazı komutlarda çalışır ama environment variable'lar sorun çıkarabilir ⚠️

---

**Son Güncelleme**: 2025-10-05
**Çalışan Versiyon**: Background mode ile manuel başlatma
