import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function LandingPage() {
    const { darkMode, toggleDarkMode } = useTheme();
    return (
        <div className={`${darkMode ? 'dark bg-surface text-on-surface' : 'bg-slate-50 text-slate-900'} font-body selection:bg-primary/30 min-h-screen transition-colors duration-300`}>
            {/* Header Section */}
            <nav className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl">
                <div className="flex justify-between items-center px-4 sm:px-8 py-4 max-w-7xl mx-auto">
                    <div 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="h-16 cursor-pointer group flex items-center gap-2"
                    >
                        <img 
                            src="/logo.png" 
                            alt="Crisis Bridge Logo" 
                            className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="hidden md:flex gap-8 items-center">
                        <a className="font-['Inter'] text-sm font-medium tracking-wide text-slate-400 hover:text-slate-100 transition-all duration-300 ease-in-out" href="#features">Features</a>
                        <a className="font-['Inter'] text-sm font-medium tracking-wide text-slate-400 hover:text-slate-100 transition-all duration-300 ease-in-out" href="#how-it-works">How It Works</a>
                        <a className="font-['Inter'] text-sm font-medium tracking-wide text-slate-400 hover:text-slate-100 transition-all duration-300 ease-in-out" href="#emergency-types">Emergency Types</a>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                                darkMode
                                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {darkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        <Link to="/login" className={`hidden sm:inline-flex px-5 py-2 rounded-xl text-sm font-medium border transition-all duration-300 ${
                            darkMode
                                ? 'text-primary border-primary/20 hover:bg-primary/10'
                                : 'text-blue-600 border-blue-100 hover:bg-blue-50'
                        }`}>Login</Link>
                        <Link to="/signup" className="px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-error-container text-on-error-container sos-glow hover:scale-105 active:scale-95 transition-all duration-300">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className={`relative pt-32 pb-20 overflow-hidden min-h-screen flex flex-col justify-center transition-colors duration-500 ${
                darkMode ? 'bg-gradient-to-b from-slate-950 to-surface' : 'bg-gradient-to-b from-blue-50 to-white'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-tertiary-fixed text-on-tertiary-fixed-variant shadow-lg shadow-tertiary/10">
                            One Tap. Every Responder. Zero Delay.
                        </span>
                        <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] transition-colors ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>
                            Emergency Response at the Speed of a Tap
                        </h1>
                        <p className={`text-xl max-w-xl leading-relaxed transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-600'}`}>
                            Crisis Bridge connects hotel guests, staff, and admins in one unified emergency platform, alerting responders in under 2 seconds.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/signup" className="px-4 sm:px-8 py-4 rounded-xl text-lg font-bold bg-error text-on-error flex items-center gap-3 hover:scale-105 transition-transform sos-glow">
                                <span className="material-symbols-outlined">luggage</span>
                                I'm a Guest
                            </Link>
                            <Link to="/login" className={`px-4 sm:px-8 py-4 rounded-xl text-lg font-bold border transition-all duration-300 flex items-center ${
                                darkMode
                                    ? 'text-on-surface border-outline-variant hover:bg-surface-bright'
                                    : 'text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}>
                                <span className="material-symbols-outlined mr-2">hotel</span>
                                Admin / Staff Login
                            </Link>
                        </div>
                    </div>
                    <div className="relative flex justify-center items-center py-20 lg:py-0">
                        <div className="absolute w-[300px] h-[300px] bg-error/20 rounded-full blur-[100px]"></div>
                        <div className="relative z-10 w-64 h-64 bg-surface-container-highest rounded-full flex items-center justify-center shadow-2xl border border-error/30 group">
                            <div className="absolute inset-0 rounded-full border-4 border-error/40 animate-ripple"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-error/20 animate-ripple" style={{ animationDelay: '0.6s' }}></div>
                            <div className="absolute inset-0 rounded-full border-4 border-error/10 animate-ripple" style={{ animationDelay: '1.2s' }}></div>
                            <span className="text-8xl select-none group-hover:scale-110 transition-transform">🆘</span>
                        </div>
                    </div>
                </div>
                <div className={`absolute bottom-0 left-0 w-full h-32 transition-colors ${
                    darkMode ? 'bg-gradient-to-t from-surface-container-low to-transparent' : 'bg-gradient-to-t from-white to-transparent'
                }`}></div>
            </header>

            {/* How It Works */}
            <section className={`py-24 transition-colors duration-500 ${darkMode ? 'bg-surface-container-low' : 'bg-white'}`} id="how-it-works">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="text-center mb-20">
                        <h2 className={`text-4xl font-extrabold tracking-tight mb-4 transition-colors ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>How Crisis Bridge Works</h2>
                        <p className={`max-w-2xl mx-auto transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-500'}`}>Seamless synchronization from the first touchpoint to the final resolution.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { num: '01', icon: 'touch_app', color: 'bg-primary-container text-primary', numColor: darkMode ? 'text-primary/10 group-hover:text-primary/20' : 'text-slate-200 group-hover:text-slate-300', title: 'Guest Taps SOS', desc: 'Guests trigger an alert through their room key, smartphone, or dedicated SOS kiosk instantly.' },
                            { num: '02', icon: 'dashboard', color: 'bg-secondary-container text-secondary', numColor: darkMode ? 'text-secondary/10 group-hover:text-secondary/20' : 'text-slate-200 group-hover:text-slate-300', title: 'Dashboard Activates Instantly', desc: 'Central command screens pulse red, showing exact location data and guest medical profiles.' },
                            { num: '03', icon: 'support_agent', color: 'bg-tertiary-container text-tertiary', numColor: darkMode ? 'text-tertiary/10 group-hover:text-tertiary/20' : 'text-slate-200 group-hover:text-slate-300', title: 'Staff Responds in Real-Time', desc: 'Nearest security and medical teams receive haptic alerts and route maps to the incident.' },
                        ].map((card, i) => (
                            <div key={i} className={`group p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 ${
                                darkMode
                                    ? 'bg-surface-container-high hover:bg-surface-bright'
                                    : 'bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 border border-slate-100'
                            }`}>
                                <div className="flex justify-between items-start mb-12">
                                    <span className={`text-5xl font-black transition-colors ${card.numColor}`}>{card.num}</span>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.color}`}>
                                        <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                                    </div>
                                </div>
                                <h3 className={`text-2xl font-bold mb-4 transition-colors ${darkMode ? 'text-on-surface' : 'text-slate-800'}`}>{card.title}</h3>
                                <p className={`leading-relaxed transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-600'}`}>{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Bento Grid */}
            <section className={`py-24 transition-colors duration-500 ${darkMode ? 'bg-surface' : 'bg-slate-50/50'}`} id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <h2 className={`text-4xl font-extrabold tracking-tight mb-16 text-center transition-colors ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>Unified Command Architecture</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: 'notification_important', color: 'text-error', border: 'border-error', title: 'Instant SOS Alerts', desc: 'Global hotel-wide broadcast within 2 seconds of detection.' },
                            { icon: 'palette', color: 'text-tertiary', border: 'border-tertiary', title: 'Color-Coded Emergencies', desc: 'Instantly recognize the nature of the crisis via unified lighting.' },
                            { icon: 'chat_bubble', color: 'text-primary', border: 'border-primary', title: 'Live Incident Chat', desc: 'Direct messaging between victims and responders for reassurance.' },
                            { icon: 'call', color: 'text-secondary', border: 'border-secondary', title: 'Emergency Voice Calls', desc: 'Priority VOIP channels that bypass busy hotel switchboards.' },
                            { icon: 'smart_toy', color: 'text-[#8b5cf6]', border: 'border-[#8b5cf6]', title: 'AI Safety Chatbot', desc: 'Automated triage that provides immediate first-aid instructions.' },
                            { icon: 'history', color: 'text-[#2dd4bf]', border: 'border-[#2dd4bf]', title: 'Full Incident Audit Trail', desc: 'Comprehensive logging of every action for post-crisis reporting.' },
                        ].map((f, i) => (
                            <div key={i} className={`p-8 rounded-3xl border-l-4 ${f.border} transition-all ${
                                darkMode
                                    ? 'bg-surface-container hover:bg-surface-container-highest'
                                    : 'bg-white hover:shadow-lg border-y border-r border-slate-100 shadow-sm'
                            }`}>
                                <span className={`material-symbols-outlined ${f.color} mb-6 block text-4xl`}>{f.icon}</span>
                                <h4 className={`text-xl font-bold mb-2 transition-colors ${darkMode ? 'text-on-surface' : 'text-slate-800'}`}>{f.title}</h4>
                                <p className={`text-sm leading-relaxed transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-600'}`}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Emergency Color Guide */}
            <section className={`py-24 transition-colors duration-500 ${darkMode ? 'bg-surface-container-lowest' : 'bg-white'}`} id="emergency-types">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div>
                            <h2 className={`text-4xl font-extrabold tracking-tight mb-4 transition-colors ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>Emergency Color Guide</h2>
                            <p className={`max-w-xl transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-500'}`}>Universal visual standards ensure that response is intuitive even when communication fails.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-1 w-24 bg-error rounded-full"></div>
                            <div className="h-1 w-12 bg-secondary rounded-full"></div>
                            <div className="h-1 w-12 bg-primary rounded-full"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { badge: 'Level 1', badgeClass: darkMode ? 'bg-error-container text-on-error-container' : 'bg-red-100 text-red-700', icon: 'local_fire_department', iconColor: 'text-error', title: 'FIRE', titleColor: 'text-error', border: 'border-error', desc: 'Evacuation protocols, fire system activation, and room containment status.' },
                            { badge: 'Priority', badgeClass: darkMode ? 'bg-secondary-container text-on-secondary-container' : 'bg-emerald-100 text-emerald-700', icon: 'medical_services', iconColor: 'text-secondary', title: 'MEDICAL', titleColor: 'text-secondary', border: 'border-secondary', desc: 'AED locations, first responder dispatch, and allergy profiles.' },
                            { badge: 'Tactical', badgeClass: darkMode ? 'bg-[#4c1d95] text-[#ddd6fe]' : 'bg-purple-100 text-purple-700', icon: 'security', iconColor: 'text-[#a78bfa]', title: 'SECURITY', titleColor: 'text-[#a78bfa]', border: 'border-[#a78bfa]', desc: 'Intruder alerts, lockdown procedures, and live CCTV feed integration.' },
                            { badge: 'Standard', badgeClass: darkMode ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-amber-100 text-amber-700', icon: 'warning', iconColor: 'text-tertiary', title: 'COMMON', titleColor: 'text-tertiary', border: 'border-tertiary', desc: 'Maintenance issues, elevator failures, and guest distress signals.' },
                        ].map((item, i) => (
                            <div key={i} className={`p-6 rounded-2xl border-b-4 ${item.border} transition-all group ${
                                darkMode ? 'bg-surface-container-low hover:bg-surface-container' : 'bg-slate-50 hover:bg-white hover:shadow-lg border-x border-t border-slate-100'
                            }`}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${item.badgeClass}`}>{item.badge}</span>
                                    <span className={`material-symbols-outlined ${item.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                                </div>
                                <h4 className={`text-2xl font-bold ${item.titleColor} mb-2`}>{item.title}</h4>
                                <p className={`text-sm transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-600'}`}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={`py-24 transition-colors duration-500 ${darkMode ? 'bg-surface-container-low' : 'bg-slate-50'}`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
                    <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-6 transition-colors ${darkMode ? 'text-on-surface' : 'text-slate-900'}`}>
                        Ready to Upgrade Your Hotel's Emergency Protocol?
                    </h2>
                    <p className={`text-xl mb-12 transition-colors ${darkMode ? 'text-on-surface-variant' : 'text-slate-500'}`}>
                        Join hundreds of hotels worldwide using Crisis Bridge to protect their staff and guests.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/signup" className="px-10 py-5 rounded-2xl text-lg font-bold bg-error text-on-error hover:scale-105 transition-transform sos-glow">
                            Get Started for Free
                        </Link>
                        <Link to="/login" className={`px-10 py-5 rounded-2xl text-lg font-bold border-2 transition-all ${
                            darkMode ? 'border-outline text-on-surface hover:bg-surface-bright' : 'border-slate-200 text-slate-700 hover:bg-white'
                        }`}>
                            View Live Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-500 pt-20 pb-10 border-t border-tertiary/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="text-2xl font-black text-slate-100 mb-6 tracking-tighter">Crisis Bridge</div>
                            <p className="text-sm leading-relaxed mb-6">Empowering hotels with the world's most responsive emergency synchronization platform.</p>
                        </div>
                        <div>
                            <h5 className="text-slate-100 font-bold mb-6">Platform</h5>
                            <ul className="space-y-4 text-sm">
                                <li><a className="hover:text-blue-400 transition-colors" href="#">Features</a></li>
                                <li><a className="hover:text-blue-400 transition-colors" href="#">How It Works</a></li>
                                <li><a className="hover:text-blue-400 transition-colors" href="#">Security Standards</a></li>
                                <li><a className="hover:text-blue-400 transition-colors" href="#">Case Studies</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-slate-100 font-bold mb-6">Company</h5>
                            <ul className="space-y-4 text-sm">
                                <li><a className="hover:text-blue-400 transition-colors" href="#">About Us</a></li>
                                <li><a className="hover:text-blue-400 transition-colors" href="#">Contact Support</a></li>
                                <li><a className="hover:text-blue-400 transition-colors" href="#">Privacy Policy</a></li>
                                <li><a className="hover:text-blue-400 transition-colors" href="#">Press Kit</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-slate-100 font-bold mb-6">Contact</h5>
                            <ul className="space-y-4 text-sm">
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-tertiary">mail</span>
                                    emergency@crisisbridge.io
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-tertiary">location_on</span>
                                    Tech Hub, Bangalore
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-xs">© 2024 Crisis Bridge. All rights reserved.</p>
                        <div className="bg-tertiary/10 border border-tertiary/20 px-4 py-2 rounded-lg text-[10px] text-tertiary font-bold tracking-wider max-w-lg text-center md:text-right uppercase">
                            EMERGENCY DISCLAIMER: THIS SYSTEM IS A SUPPLEMENTAL TOOL AND DOES NOT REPLACE DIRECT CONTACT WITH LOCAL EMERGENCY SERVICES (911/112).
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

