@echo off
chcp 65001 >nul
echo ========================================
echo GitHub'a Yükleme - HAZIR
echo ========================================
echo.
echo ✅ Git yüklendi
echo ✅ Repository başlatıldı
echo ✅ Dosyalar commit edildi
echo ✅ Branch: main
echo.
echo ========================================
echo ŞİMDİ YAPMANIZ GEREKENLER:
echo ========================================
echo.
echo 1. GitHub'da repository oluşturun:
echo    https://github.com/new
echo.
echo 2. Repository adı: haydaymalzeme-yapayzeka
echo    (veya istediğiniz başka bir ad)
echo.
echo 3. Public veya Private seçin
echo.
echo 4. "Create repository" tıklayın
echo.
echo 5. Repository oluşturduktan sonra bu pencereye dönün
echo.
pause
echo.
echo ========================================
echo GitHub'a yükleniyor...
echo ========================================
echo.

powershell -Command "$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); git push -u origin main"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ BAŞARIYLA YÜKLENDİ!
    echo ========================================
    echo.
    echo Repository: https://github.com/muhsinzengin34/haydaymalzeme-yapayzeka
    echo.
    echo Sonraki adımlar:
    echo 1. .env dosyası oluşturun: copy .env.example .env
    echo 2. .env dosyasını düzenleyin
    echo 3. npm install
    echo 4. npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ HATA!
    echo ========================================
    echo.
    echo Repository bulunamadı veya erişim hatası.
    echo.
    echo Çözüm:
    echo 1. GitHub'da repository oluşturduğunuzdan emin olun
    echo 2. Repository adı doğru mu kontrol edin
    echo 3. GitHub'a giriş yapın (ilk kez kullanıyorsanız)
    echo.
    echo Manuel yükleme için:
    echo git push -u origin main
    echo.
)

pause
