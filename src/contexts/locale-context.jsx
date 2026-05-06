/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LOCALE_STORAGE_KEY = 'healthai_locale';

const TRANSLATIONS = {
  en: {
    feedback: 'Feedback',
    settings: 'Settings',
    profile: 'Profile',
    signOut: 'Sign out',
    signIn: 'Sign in',
    register: 'Register',
    discover: 'Discover',
    dashboard: 'Dashboard',
    help: 'Help',
    notifications: 'Notifications',
    markAllAsRead: 'Mark all as read',
    noNotifications: 'No notifications',
    savedListings: 'Saved Listings',
    noSavedListings: 'No saved listings yet.',
    discoverListings: 'Discover listings',
    inbox: 'Inbox',
    allRequests: 'All requests',
    awaitingResponse: 'Awaiting response',
    ndaAccepted: 'NDA / accepted',
    scheduled: 'Scheduled',
    quickActions: 'Quick actions',
    postProject: 'Post project',
    openRequestsWorkspace: 'Open requests workspace',
    projectsMatchedToYourWork: 'Projects matched to your work',
    discoverHowMatchingWorks: 'Discover how matching works',
    forYouBasedOnProfile: 'For you · based on your profile',
    privateListings: 'Private listings',
    noResultsFor: 'no results found for',
    noResults: 'No results found',
    noResultsDesc: 'Try different keywords or filters.',
    clearFilters: 'Clear Filters',
    noMeetingsTitle: 'No meetings yet',
    noMeetingsDesc: 'Browse listings and send meeting requests to projects you are interested in.',
    discoverListingsAction: 'Discover Listings',
    noPostsTitle: 'No listings found',
    noPostsDescCanCreate: 'Start finding the right collaborator by sharing your project.',
    noPostsDesc: 'No active listings at the moment.',
    createPostAction: 'Create Listing',
    noBookmarksTitle: 'No saved listings',
    noBookmarksDesc: 'Save listings you like to easily find them later.',
    browseListingsAction: 'Browse Listings',
  },
  tr: {
    feedback: 'Geri Bildirim',
    settings: 'Ayarlar',
    profile: 'Profil',
    signOut: 'Çıkış yap',
    signIn: 'Giriş yap',
    register: 'Kayıt ol',
    discover: 'Keşfet',
    dashboard: 'Panel',
    help: 'Yardım',
    notifications: 'Bildirimler',
    markAllAsRead: 'Tümünü okundu işaretle',
    noNotifications: 'Bildirim yok',
    savedListings: 'Kaydettiğim İlanlar',
    noSavedListings: 'Henüz kaydettiğin ilan yok.',
    discoverListings: 'İlanları keşfet',
    inbox: 'Gelen Kutusu',
    allRequests: 'Tüm talepler',
    awaitingResponse: 'Yanıt bekleyen',
    ndaAccepted: 'Gizlilik Sözleşmesi / Kabul Edildi',
    scheduled: 'Planlanmış',
    quickActions: 'Hızlı işlemler',
    postProject: 'İlan ver',
    openRequestsWorkspace: 'Talepleri yönet',
    projectsMatchedToYourWork: 'Sana uygun projeler',
    discoverHowMatchingWorks: 'Eşleşmeler nasıl çalışır?',
    forYouBasedOnProfile: 'Profiline göre · Senin için',
    privateListings: 'Özel ilanlar',
    noResultsFor: 'için sonuç bulunamadı',
    noResults: 'Sonuç bulunamadı',
    noResultsDesc: 'Farklı anahtar kelimeler ya da filtreler deneyin.',
    clearFilters: 'Filtreleri Temizle',
    noMeetingsTitle: 'Henüz toplantı yok',
    noMeetingsDesc: 'İlanlara göz atarak ilgilendiğin projelere toplantı talebi gönderebilirsin.',
    discoverListingsAction: 'İlanları Keşfet',
    noPostsTitle: 'İlan bulunamadı',
    noPostsDescCanCreate: 'Projeni paylaşarak doğru iş birlikçiyi bulmaya başla.',
    noPostsDesc: 'Şu anda aktif ilan yok.',
    createPostAction: 'İlan Oluştur',
    noBookmarksTitle: 'Kaydedilen ilan yok',
    noBookmarksDesc: 'Beğendiğin ilanları kaydet, daha sonra kolayca bul.',
    browseListingsAction: 'İlanlara Bak',
  },
  pt: {
    feedback: 'Feedback',
    settings: 'Configurações',
    profile: 'Perfil',
    signOut: 'Sair',
    signIn: 'Entrar',
    register: 'Registrar',
    discover: 'Descobrir',
    dashboard: 'Painel',
    help: 'Ajuda',
    notifications: 'Notificações',
    markAllAsRead: 'Marcar tudo como lido',
    noNotifications: 'Sem notificações',
    savedListings: 'Anúncios Salvos',
    noSavedListings: 'Nenhum anúncio salvo ainda.',
    discoverListings: 'Descobrir anúncios',
    inbox: 'Caixa de Entrada',
    allRequests: 'Todas as solicitações',
    awaitingResponse: 'Aguardando resposta',
    ndaAccepted: 'NDA / Aceito',
    scheduled: 'Agendado',
    quickActions: 'Ações rápidas',
    postProject: 'Publicar projeto',
    openRequestsWorkspace: 'Abrir workspace de solicitações',
    projectsMatchedToYourWork: 'Projetos que combinam com seu perfil',
    discoverHowMatchingWorks: 'Descubra como o pareamento funciona',
    forYouBasedOnProfile: 'Para você · baseado no seu perfil',
    privateListings: 'Anúncios privados',
    noResultsFor: 'nenhum resultado para',
    noResults: 'Nenhum resultado',
    noResultsDesc: 'Tente palavras-chave ou filtros diferentes.',
    clearFilters: 'Limpar Filtros',
    noMeetingsTitle: 'Nenhuma reunião ainda',
    noMeetingsDesc: 'Navegue pelos anúncios e envie solicitações de reunião para projetos do seu interesse.',
    discoverListingsAction: 'Descobrir Anúncios',
    noPostsTitle: 'Nenhum anúncio encontrado',
    noPostsDescCanCreate: 'Comece a encontrar o colaborador certo compartilhando seu projeto.',
    noPostsDesc: 'Nenhum anúncio ativo no momento.',
    createPostAction: 'Criar Anúncio',
    noBookmarksTitle: 'Nenhum anúncio salvo',
    noBookmarksDesc: 'Salve anúncios que você gosta para encontrá-los facilmente depois.',
    browseListingsAction: 'Procurar Anúncios',
  },
  es: {
    feedback: 'Comentarios',
    settings: 'Ajustes',
    profile: 'Perfil',
    signOut: 'Cerrar sesión',
    signIn: 'Iniciar sesión',
    register: 'Registrarse',
    discover: 'Descubrir',
    dashboard: 'Panel',
    help: 'Ayuda',
    notifications: 'Notificaciones',
    markAllAsRead: 'Marcar todo como leído',
    noNotifications: 'No hay notificaciones',
    savedListings: 'Anuncios guardados',
    noSavedListings: 'Aún no has guardado anuncios.',
    discoverListings: 'Descubrir anuncios',
    inbox: 'Bandeja de entrada',
    allRequests: 'Todas las solicitudes',
    awaitingResponse: 'Esperando respuesta',
    ndaAccepted: 'NDA / Aceptado',
    scheduled: 'Programado',
    quickActions: 'Acciones rápidas',
    postProject: 'Publicar proyecto',
    openRequestsWorkspace: 'Abrir workspace de solicitudes',
    projectsMatchedToYourWork: 'Proyectos compatibles con tu perfil',
    discoverHowMatchingWorks: 'Descubre cómo funciona el emparejamiento',
    forYouBasedOnProfile: 'Para ti · basado en tu perfil',
    privateListings: 'Anuncios privados',
    noResultsFor: 'sin resultados para',
    noResults: 'No se encontraron resultados',
    noResultsDesc: 'Intenta con diferentes palabras clave o filtros.',
    clearFilters: 'Borrar Filtros',
    noMeetingsTitle: 'Aún no hay reuniones',
    noMeetingsDesc: 'Explora anuncios y envía solicitudes de reunión a los proyectos que te interesen.',
    discoverListingsAction: 'Descubrir Anuncios',
    noPostsTitle: 'No se encontraron anuncios',
    noPostsDescCanCreate: 'Empieza a encontrar al colaborador adecuado compartiendo tu proyecto.',
    noPostsDesc: 'No hay anuncios activos en este momento.',
    createPostAction: 'Crear Anuncio',
    noBookmarksTitle: 'No hay anuncios guardados',
    noBookmarksDesc: 'Guarda los anuncios que te gustan para encontrarlos fácilmente después.',
    browseListingsAction: 'Explorar Anuncios',
  },
};

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'tr' || stored === 'en' || stored === 'pt' || stored === 'es') return stored;
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo(() => {
    const t = (key, fallback = '') => TRANSLATIONS[locale]?.[key] ?? fallback;
    return { locale, setLocale, t };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
