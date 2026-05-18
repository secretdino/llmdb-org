'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  KeyRound, 
  Sparkles, 
  ShieldAlert, 
  Database,
  ArrowRight,
  Loader2,
  Gauge
} from 'lucide-react';
import { useTranslation } from '@/components/i18n-provider';

const GithubIcon = ({ className, ...props }: { className?: string } & React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  // Mode toggling state (Login vs Register)
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Tab states (Credentials vs GitHub OAuth)
  const [activeTab, setActiveTab] = useState<'credentials' | 'github'>('credentials');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Action status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Read error from URL parameters (e.g. NextAuth auth errors)
  const urlError = searchParams.get('error');
  React.useEffect(() => {
    if (urlError === 'CredentialsSignin') {
      setErrorMsg(t("login.alerts.invalid_credentials"));
    } else if (urlError) {
      setErrorMsg(t("login.alerts.auth_error"));
    }
  }, [urlError, t]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t("login.alerts.enter_email_password"));
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl
      });

      if (res?.error) {
        setErrorMsg(res.error === 'CredentialsSignin' ? t("login.alerts.incorrect_credentials") : res.error);
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Credentials sign-in error details:", err);
      setErrorMsg(t("login.alerts.network_error"));
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setErrorMsg(t("login.alerts.all_fields_required"));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t("login.alerts.password_too_short"));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t("login.alerts.passwords_mismatch"));
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });

      const data = await registerRes.json();

      if (!registerRes.ok) {
        setErrorMsg(data.error || 'Registration failed.');
        setIsLoading(false);
      } else {
        setSuccessMsg(t("login.alerts.account_created"));
        
        // Auto-login after successful registration
        const res = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl
        });

        if (res?.error) {
          setErrorMsg(t("login.alerts.autologin_failed"));
          setIsLoading(false);
          setIsRegistering(false);
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      }
    } catch (err) {
      console.error("User registration error details:", err);
      setErrorMsg(t("login.alerts.registration_network_error"));
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await signIn('github', { callbackUrl });
    } catch (err) {
      console.error("GitHub OAuth dispatch error details:", err);
      setErrorMsg(t("login.alerts.github_failed"));
      setIsLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-surface-0 p-4"
      id="login_portal_container"
    >
      {/* Visual background atmospheric lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-600/8 blur-[100px] pointer-events-none" id="login_bg_glow_indigo" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-teal-600/5 blur-[120px] pointer-events-none" id="login_bg_glow_emerald" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-600/3 blur-[150px] pointer-events-none" id="login_bg_glow_violet" />

      {/* Main Glassmorphism Sign-In Portal Card */}
      <div 
        className="w-full max-w-[440px] glass-card rounded-xl p-5 md:p-6 border border-zinc-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative z-10 flex flex-col gap-6"
        id="login_portal_card"
      >
        {/* Portal Header */}
        <div className="text-center flex flex-col items-center gap-2" id="login_portal_header">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-600/20 mb-2 border border-amber-400/20" id="login_header_icon_container">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-white flex items-center gap-1.5 justify-center">
            <Sparkles className="w-4 h-4 text-accent-amber" />
            {isRegistering ? t("login.card.title_signup") : t("login.card.title_signin")}
          </h1>
          <p className="text-xs text-zinc-400 max-w-[300px]">
            {isRegistering 
              ? t("login.card.subtitle_signup")
              : t("login.card.subtitle_signin")
            }
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-surface-1/80 p-0.5 rounded-lg border border-zinc-800 gap-1" id="login_tabs">
          <button
            id="tab_credentials"
            onClick={() => { setActiveTab('credentials'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 px-3 text-[10px] font-bold rounded-md transition duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-accent-amber text-surface-0 shadow-md shadow-amber-600/10'
                : 'text-zinc-400 hover:text-white hover:bg-surface-2'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            {isRegistering ? t("login.card.tab_credentials_signup") : t("login.card.tab_credentials_signin")}
          </button>
          <button
            id="tab_github"
            onClick={() => { setActiveTab('github'); setErrorMsg(null); setSuccessMsg(null); setIsRegistering(false); }}
            className={`flex-1 py-2 px-3 text-[10px] font-bold rounded-md transition duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'github'
                ? 'bg-accent-amber text-surface-0 shadow-md shadow-amber-600/10'
                : 'text-zinc-400 hover:text-white hover:bg-surface-2'
            }`}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            {t("login.card.tab_github")}
          </button>
        </div>

        {/* Error Callout */}
        {errorMsg && (
          <div 
            className="flex gap-2.5 bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 font-medium"
            id="login_error_alert"
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Callout */}
        {successMsg && (
          <div 
            className="flex gap-2.5 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg text-xs text-accent-teal font-medium"
            id="login_success_alert"
          >
            <Sparkles className="w-4 h-4 flex-shrink-0 text-accent-teal animate-pulse" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Contents */}
        {activeTab === 'credentials' ? (
          isRegistering ? (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4" id="login_register_form">
              <div className="flex flex-col gap-1.5" id="register_field_name_group">
                <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-heading">
                  {t("login.fields.name")} <span className="text-zinc-500 font-normal">{t("login.fields.optional")}</span>
                </label>
                <input
                  id="input_register_name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("login.fields.name_placeholder")}
                  className="w-full glass-input px-3.5 py-2 rounded-md text-xs font-sans text-zinc-200 placeholder-zinc-600 focus:outline-none transition border border-zinc-800 focus:border-amber-500/25"
                />
              </div>

              <div className="flex flex-col gap-1.5" id="register_field_email_group">
                <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-heading">
                  {t("login.fields.email")}
                </label>
                <input
                  id="input_register_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.fields.email_placeholder")}
                  className="w-full glass-input px-3.5 py-2 rounded-md text-xs font-sans text-zinc-200 placeholder-zinc-600 focus:outline-none transition border border-zinc-800 focus:border-amber-500/25"
                />
              </div>

              <div className="flex flex-col gap-1.5" id="register_field_password_group">
                <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-heading">
                  {t("login.fields.password")}
                </label>
                <input
                  id="input_register_password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.fields.password_placeholder")}
                  className="w-full glass-input px-3.5 py-2 rounded-md text-xs font-sans text-zinc-200 placeholder-zinc-600 focus:outline-none transition border border-zinc-800 focus:border-amber-500/25"
                />
              </div>

              <div className="flex flex-col gap-1.5" id="register_field_confirm_password_group">
                <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-heading">
                  {t("login.fields.confirm_password")}
                </label>
                <input
                  id="input_register_confirm_password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("login.fields.confirm_password_placeholder")}
                  className="w-full glass-input px-3.5 py-2 rounded-md text-xs font-sans text-zinc-200 placeholder-zinc-600 focus:outline-none transition border border-zinc-800 focus:border-amber-500/25"
                />
              </div>

              <button
                id="btn_submit_register"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-xs font-bold text-white rounded-md flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/15 disabled:opacity-50 transition font-heading border border-amber-400/20 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("login.buttons.creating_profile")}
                  </>
                ) : (
                  <>
                    {t("login.buttons.signup")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Toggle link to Login mode */}
              <div className="text-center mt-1" id="register_toggle_login_link_wrapper">
                <button
                  id="btn_toggle_login"
                  type="button"
                  onClick={() => { setIsRegistering(false); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-[10px] text-accent-amber hover:text-amber-300 font-bold uppercase tracking-wider transition duration-150"
                >
                  {t("login.buttons.have_account")}
                </button>
              </div>
            </form>
          ) : (
            /* Credentials Sign In Form */
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4" id="login_credentials_form">
              <div className="flex flex-col gap-1.5" id="login_field_email_group">
                <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-heading">
                  {t("login.fields.email")}
                </label>
                <input
                  id="input_login_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.fields.email_placeholder")}
                  className="w-full glass-input px-3.5 py-2 rounded-md text-xs font-sans text-zinc-200 placeholder-zinc-600 focus:outline-none transition border border-zinc-800 focus:border-amber-500/25"
                />
              </div>

              <div className="flex flex-col gap-1.5" id="login_field_password_group">
                <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-heading">
                  {t("login.fields.password")}
                </label>
                <input
                  id="input_login_password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.fields.password_placeholder")}
                  className="w-full glass-input px-3.5 py-2 rounded-md text-xs font-sans text-zinc-200 placeholder-zinc-600 focus:outline-none transition border border-zinc-800 focus:border-amber-500/25"
                />
              </div>

              <button
                id="btn_submit_credentials"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-xs font-bold text-white rounded-md flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/15 disabled:opacity-50 transition font-heading border border-amber-400/20 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t("login.buttons.signing_in")}
                  </>
                ) : (
                  <>
                    {t("login.buttons.signin")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Toggle link to Register mode */}
              <div className="text-center mt-1" id="login_toggle_register_link_wrapper">
                <button
                  id="btn_toggle_register"
                  type="button"
                  onClick={() => { setIsRegistering(true); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-[10px] text-accent-amber hover:text-amber-300 font-bold uppercase tracking-wider transition duration-150"
                >
                  {t("login.buttons.need_account")}
                </button>
              </div>
            </form>
          )
        ) : (
          /* GitHub Login */
          <div className="flex flex-col gap-4 text-center py-2" id="login_oauth_panel">
            <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[340px] mx-auto">
              {t("login.oauth.notice")}
            </p>

            <button
              id="btn_signin_github"
              onClick={handleGithubSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-surface-1 hover:bg-surface-2 border border-zinc-800 text-xs font-bold text-white rounded-md flex items-center justify-center gap-2.5 shadow-md transition font-heading disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              ) : (
                <GithubIcon className="w-4 h-4 text-white" />
              )}
              {isLoading ? t("login.oauth.launching") : t("login.oauth.btn_github")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface-0 text-accent-amber font-heading" id="login_portal_fallback_loading">
        <Gauge className="w-10 h-10 animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest font-bold">{t("global.loaders.auth_verifying")}</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
