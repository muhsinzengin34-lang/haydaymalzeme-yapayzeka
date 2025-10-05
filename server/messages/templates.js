// Tüm mesaj şablonları

export const GREETINGS = {
    welcome: 'Merhaba! Hayday Destek ekibine hoş geldiniz. Size nasıl yardımcı olabilirim?',
    welcomeBack: 'Tekrar hoş geldiniz! Size nasıl yardımcı olabilirim?',
    goodbye: 'Görüşmek üzere! İyi günler dilerim.',
    goodbyeAlt: 'Hoşça kalın! Başka bir sorunuz olursa her zaman buradayım.',
    thanks: 'Rica ederim! Başka bir konuda yardımcı olabilir miyim?',
    thanksGoodbye: 'Rica ederim! İyi günler dilerim.'
};

export const TIME_GREETINGS = {
    morning: 'Günaydın! Size nasıl yardımcı olabilirim?',
    afternoon: 'İyi günler! Size nasıl yardımcı olabilirim?',
    evening: 'İyi akşamlar! Size nasıl yardımcı olabilirim?',
    night: 'İyi geceler! Size nasıl yardımcı olabilirim?'
};

export const ERROR_MESSAGES = {
    general: 'Üzgünüm, mesajınızı işlerken bir hata oluştu. Lütfen tekrar deneyin.',
    aiError: 'Üzgünüm, şu anda size yardımcı olamam. Lütfen daha sonra tekrar deneyin.',
    noResponse: 'Üzgünüm, bu konuda size yardımcı olamıyorum. Fiyat listesi, ürünler veya teslimat hakkında soru sorabilirsiniz.',
    botDisabled: 'Bot şu anda devre dışı',
    emptyMessage: 'Mesaj boş olamaz',
    messageTooLong: 'Mesaj çok uzun (max 1000 karakter)',
    invalidUserId: 'Kullanıcı ID gerekli',
    userIdTooShort: 'Kullanıcı ID çok kısa'
};

export const SUCCESS_MESSAGES = {
    messageSent: 'Mesajınız başarıyla gönderildi',
    adminMessageSent: 'Admin mesajı gönderildi',
    settingsSaved: 'Ayarlar kaydedildi',
    dataUpdated: 'Veriler güncellendi'
};

export const INFO_MESSAGES = {
    processing: 'Mesajınız işleniyor...',
    thinking: 'Düşünüyorum...',
    searching: 'Bilgi aranıyor...',
    noMessages: 'Henüz mesaj yok'
};

export function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return TIME_GREETINGS.morning;
    if (hour < 18) return TIME_GREETINGS.afternoon;
    if (hour < 22) return TIME_GREETINGS.evening;
    return TIME_GREETINGS.night;
}
