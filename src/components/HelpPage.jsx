import React, { useState } from 'react'

// ─── i18n content ────────────────────────────────────────────
const HELP = {
  gettingStarted: {
    en: {
      title: 'Getting Started',
      steps: [
        { icon: '🔑', text: 'Log in on the home screen using your account.' },
        { icon: '📊', text: 'You\'ll see a dashboard showing all your inventory stats at a glance.' },
        { icon: '🏠', text: 'Tap Inventory in the menu to see all your tracked items.' },
      ],
    },
    fil: {
      title: 'Paano Magsimula',
      steps: [
        { icon: '🔑', text: 'Mag-login sa home screen gamit ang iyong account.' },
        { icon: '📊', text: 'Makikita mo ang dashboard na nagpapakita ng lahat ng iyong stats sa inventory.' },
        { icon: '🏠', text: 'I-tap ang Inventory sa menu para makita ang lahat ng iyong mga tracked na aytem.' },
      ],
    },
  },
  addingItems: {
    en: {
      title: 'Adding Items',
      steps: [
        { icon: '➕', text: 'Tap the "+ Add Item" button in the sidebar or on the inventory screen.' },
        { icon: '✏️', text: 'Fill in the item name, quantity, restock level, category, and location.' },
        { icon: '✨', text: 'Use the AI Scan button to auto-fill item details using your camera.' },
      ],
    },
    fil: {
      title: 'Pagdaragdag ng Aytem',
      steps: [
        { icon: '➕', text: 'I-tap ang "+ Add Item" na buton sa sidebar o sa inventory screen.' },
        { icon: '✏️', text: 'Punan ang pangalan, dami, restock level, kategorya, at lokasyon ng aytem.' },
        { icon: '✨', text: 'Gamitin ang AI Scan buton para awtomatikong mapunan ang detalye gamit ang camera.' },
      ],
    },
  },
  shoppingList: {
    en: {
      title: 'Shopping List',
      steps: [
        { icon: '🛒', text: 'Items that fall below their restock level appear automatically on your Shopping List.' },
        { icon: '✅', text: 'Tap "Shopping Mode" and check off items as you pick them up at the store.' },
        { icon: '🎉', text: 'Tap "Done Shopping" to automatically update quantities in your inventory.' },
      ],
    },
    fil: {
      title: 'Listahan ng Pamimili',
      steps: [
        { icon: '🛒', text: 'Ang mga aytem na mas mababa sa restock level ay awtomatikong lalabas sa Shopping List.' },
        { icon: '✅', text: 'I-tap ang "Shopping Mode" at markahan ang mga aytem habang binibili mo.' },
        { icon: '🎉', text: 'I-tap ang "Done Shopping" para awtomatikong ma-update ang mga dami sa iyong inventory.' },
      ],
    },
  },
  locations: {
    en: {
      title: 'Room Locations',
      steps: [
        { icon: '📍', text: 'Go to Locations and tap "+ Add Location" to create a storage spot (e.g. Kitchen Cabinet, Bedroom).' },
        { icon: '📷', text: 'Take a photo of the storage area so you always remember where things are.' },
        { icon: '🔍', text: 'Tap any location card to instantly filter inventory to only that room\'s items.' },
      ],
    },
    fil: {
      title: 'Mga Lokasyon ng Kwarto',
      steps: [
        { icon: '📍', text: 'Pumunta sa Locations at i-tap ang "+ Add Location" para gumawa ng lugar ng imbakan (hal. Kitchen Cabinet, Bedroom).' },
        { icon: '📷', text: 'Kumuha ng larawan ng lugar ng imbakan para laging malaman kung nasaan ang mga bagay.' },
        { icon: '🔍', text: 'I-tap ang kahit anong location card para ipakita lang ang mga aytem sa kwartong iyon.' },
      ],
    },
  },
  aiScan: {
    en: {
      title: 'AI Scan',
      steps: [
        { icon: '✨', text: 'When adding an item, tap the "✨ AI Scan" button to open the camera.' },
        { icon: '📷', text: 'Point your camera at the item, its label, or its barcode.' },
        { icon: '🤖', text: 'The AI automatically fills in the item name, category, and other details.' },
      ],
    },
    fil: {
      title: 'AI Scan',
      steps: [
        { icon: '✨', text: 'Kapag nagdadagdag ng aytem, i-tap ang "✨ AI Scan" na buton para buksan ang camera.' },
        { icon: '📷', text: 'Ituro ang camera sa aytem, sa label nito, o sa barcode nito.' },
        { icon: '🤖', text: 'Awtomatikong pipunuin ng AI ang pangalan, kategorya, at iba pang detalye ng aytem.' },
      ],
    },
  },
  tasks: {
    en: {
      title: 'Tasks for Ate Lea',
      steps: [
        { icon: '📋', text: 'Go to Tasks. As the owner, you can create task templates like "Weekly Cleaning" with multiple steps.' },
        { icon: '🗓️', text: 'Tap "Assign Today" on any template to send all its tasks to Ate Lea for the day.' },
        { icon: '📸', text: 'Ate Lea sees her tasks when she logs in, can mark them done, and take a photo as proof.' },
      ],
    },
    fil: {
      title: 'Mga Gawain para kay Ate Lea',
      steps: [
        { icon: '📋', text: 'Pumunta sa Tasks. Bilang may-ari, maaari kang gumawa ng mga task templates tulad ng "Weekly Cleaning" na may maraming hakbang.' },
        { icon: '🗓️', text: 'I-tap ang "Assign Today" sa kahit anong template para ipadala ang lahat ng gawain kay Ate Lea ngayon.' },
        { icon: '📸', text: 'Makikita ni Ate Lea ang kanyang mga gawain kapag nag-login siya, maaari niyang markahan bilang tapos, at kumuha ng larawan bilang patunay.' },
      ],
    },
  },
  notifications: {
    en: {
      title: 'Notifications',
      steps: [
        { icon: '🔔', text: 'In the sidebar, tap "Enable alerts" to turn on daily low-stock notifications.' },
        { icon: '🕐', text: 'Set your preferred alert time — the notification fires once per day at that hour.' },
        { icon: '📦', text: 'You\'ll get an alert whenever items in your inventory need restocking.' },
      ],
    },
    fil: {
      title: 'Mga Abiso',
      steps: [
        { icon: '🔔', text: 'Sa sidebar, i-tap ang "Enable alerts" para i-on ang mga pang-araw-araw na abiso ng mababang stock.' },
        { icon: '🕐', text: 'I-set ang iyong gustong oras ng alerto — isang beses lang magpapadala ng abiso bawat araw sa oras na iyon.' },
        { icon: '📦', text: 'Makakatanggap ka ng abiso kapag kailangan pang i-restock ang mga aytem sa iyong inventory.' },
      ],
    },
  },
}

// ─── Inline SVG illustrations ────────────────────────────────

function IllustrationGettingStarted() {
  return (
    <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-16">
      {/* Phone outline */}
      <rect x="22" y="4" width="36" height="52" rx="6" fill="#fff1f5" stroke="#fda4af" strokeWidth="2"/>
      <rect x="26" y="12" width="28" height="22" rx="3" fill="#fce7f3"/>
      {/* House on screen */}
      <polygon points="40,14 50,22 30,22" fill="#fda4af"/>
      <rect x="33" y="22" width="14" height="10" rx="1" fill="white"/>
      <rect x="38" y="26" width="4" height="6" rx="1" fill="#fda4af"/>
      {/* Dots/stats */}
      <rect x="28" y="37" width="8" height="3" rx="1.5" fill="#e9d5ff"/>
      <rect x="38" y="37" width="12" height="3" rx="1.5" fill="#e9d5ff"/>
      <rect x="28" y="43" width="18" height="3" rx="1.5" fill="#fce7f3"/>
      {/* Home button */}
      <circle cx="40" cy="52" r="2.5" fill="#fda4af" opacity="0.4"/>
    </svg>
  )
}

function IllustrationAddItem() {
  return (
    <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-16">
      {/* Card */}
      <rect x="8" y="8" width="64" height="44" rx="8" fill="#fff1f5" stroke="#fda4af" strokeWidth="1.5"/>
      {/* Fields */}
      <rect x="16" y="17" width="36" height="6" rx="3" fill="#fce7f3"/>
      <rect x="16" y="27" width="24" height="6" rx="3" fill="#fce7f3"/>
      <rect x="16" y="37" width="18" height="6" rx="3" fill="#e9d5ff"/>
      {/* + button */}
      <circle cx="60" cy="40" r="9" fill="url(#addGrad)"/>
      <path d="M60 36v8M56 40h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="addGrad" x1="51" y1="31" x2="69" y2="49">
          <stop stopColor="#fda4af"/>
          <stop offset="1" stopColor="#c4b5fd"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IllustrationShopping() {
  return (
    <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-16">
      {/* List background */}
      <rect x="10" y="6" width="60" height="48" rx="8" fill="#fff1f5" stroke="#fda4af" strokeWidth="1.5"/>
      {/* List items */}
      {[14, 24, 34, 44].map((y, i) => (
        <g key={y}>
          <rect x="18" y={y} width="5" height="5" rx="1.5" fill={i < 3 ? '#86efac' : '#fce7f3'} stroke={i < 3 ? '#4ade80' : '#fda4af'} strokeWidth="1"/>
          {i < 3 && <path d={`M19 ${y+2.5}l1.5 1.5 2-2`} stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>}
          <rect x="26" y={y+1} width={i === 3 ? 30 : 28} height="3" rx="1.5" fill={i < 3 ? '#d1fae5' : '#fce7f3'} opacity={i < 3 ? 0.8 : 1}/>
        </g>
      ))}
      {/* Cart icon */}
      <circle cx="62" cy="50" r="7" fill="url(#cartGrad)"/>
      <path d="M58.5 47h1l1 4h3l.5-2.5H60" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="61" cy="52" r="0.7" fill="white"/>
      <circle cx="63.5" cy="52" r="0.7" fill="white"/>
      <defs>
        <linearGradient id="cartGrad" x1="55" y1="43" x2="69" y2="57">
          <stop stopColor="#fda4af"/><stop offset="1" stopColor="#c4b5fd"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IllustrationLocations() {
  return (
    <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-16">
      {/* Location card 1 */}
      <rect x="6" y="12" width="30" height="36" rx="6" fill="#fff1f5" stroke="#fda4af" strokeWidth="1.5"/>
      <rect x="9" y="15" width="24" height="18" rx="4" fill="#fce7f3"/>
      <circle cx="21" cy="24" r="5" fill="#fda4af" opacity="0.5"/>
      <path d="M21 21v3l2 1" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="11" y="36" width="16" height="3" rx="1.5" fill="#fce7f3"/>
      <rect x="11" y="41" width="10" height="2.5" rx="1.25" fill="#e9d5ff"/>
      {/* Location card 2 */}
      <rect x="44" y="12" width="30" height="36" rx="6" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="1.5"/>
      <rect x="47" y="15" width="24" height="18" rx="4" fill="#ede9fe"/>
      <circle cx="59" cy="24" r="5" fill="#c4b5fd" opacity="0.5"/>
      <path d="M59 21 c0 3 -3 5 0 8 c3 -3 0 -5 0 -8Z" fill="#c4b5fd"/>
      <rect x="49" y="36" width="16" height="3" rx="1.5" fill="#ede9fe"/>
      <rect x="49" y="41" width="10" height="2.5" rx="1.25" fill="#fce7f3"/>
      {/* Pin connectors */}
      <line x1="36" y1="30" x2="44" y2="30" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="2 2"/>
    </svg>
  )
}

function IllustrationAIScan() {
  return (
    <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-16">
      {/* Camera viewfinder */}
      <rect x="14" y="10" width="52" height="40" rx="7" fill="#fff1f5" stroke="#fda4af" strokeWidth="1.5"/>
      {/* Corner brackets */}
      <path d="M22 20h-4v-4" stroke="#fda4af" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M58 20h4v-4" stroke="#fda4af" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M22 40h-4v4" stroke="#fda4af" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M58 40h4v4" stroke="#fda4af" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Scan line */}
      <line x1="18" y1="30" x2="62" y2="30" stroke="url(#scanGrad)" strokeWidth="2" strokeLinecap="round"/>
      {/* Barcode lines */}
      <rect x="28" y="22" width="2" height="16" rx="1" fill="#c4b5fd" opacity="0.7"/>
      <rect x="32" y="22" width="1" height="16" rx="0.5" fill="#c4b5fd" opacity="0.7"/>
      <rect x="35" y="22" width="3" height="16" rx="1" fill="#c4b5fd" opacity="0.7"/>
      <rect x="40" y="22" width="1" height="16" rx="0.5" fill="#c4b5fd" opacity="0.7"/>
      <rect x="43" y="22" width="2" height="16" rx="1" fill="#c4b5fd" opacity="0.7"/>
      <rect x="47" y="22" width="3" height="16" rx="1" fill="#c4b5fd" opacity="0.7"/>
      {/* Sparkles */}
      <text x="60" y="14" fontSize="9" fill="#fbbf24">✨</text>
      <text x="10" y="16" fontSize="7" fill="#fda4af">✦</text>
      <defs>
        <linearGradient id="scanGrad" x1="18" y1="30" x2="62" y2="30">
          <stop stopColor="#fda4af"/><stop offset="1" stopColor="#c4b5fd"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IllustrationTasks() {
  return (
    <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-16">
      {/* Main board */}
      <rect x="8" y="6" width="64" height="48" rx="8" fill="#fff1f5" stroke="#fda4af" strokeWidth="1.5"/>
      {/* Task rows */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="16" y={16 + i * 10} width="5" height="5" rx="1.5"
            fill={i < 2 ? '#86efac' : '#fce7f3'}
            stroke={i < 2 ? '#4ade80' : '#fda4af'} strokeWidth="1"/>
          {i < 2 && <path d={`M17 ${18.5 + i * 10}l1.5 1.5 2-2`} stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>}
          <rect x="24" y={17.5 + i * 10} width={i < 2 ? 22 : 30} height="3" rx="1.5"
            fill={i < 2 ? '#d1fae5' : '#fce7f3'} opacity={i < 2 ? 0.8 : 1}/>
          {i >= 2 && <rect x="55" y={17.5 + i * 10} width="10" height="3" rx="1.5" fill="#e9d5ff"/>}
        </g>
      ))}
      {/* Camera icon (photo proof) */}
      <circle cx="60" cy="46" r="8" fill="url(#taskGrad)"/>
      <rect x="55" y="42.5" width="10" height="7" rx="1.5" fill="none" stroke="white" strokeWidth="1.2"/>
      <circle cx="60" cy="46" r="2" fill="none" stroke="white" strokeWidth="1.2"/>
      <rect x="58" y="41.5" width="4" height="2" rx="1" fill="white"/>
      <defs>
        <linearGradient id="taskGrad" x1="52" y1="38" x2="68" y2="54">
          <stop stopColor="#fda4af"/><stop offset="1" stopColor="#c4b5fd"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function IllustrationNotifications() {
  return (
    <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-16">
      {/* Bell */}
      <path d="M40 8 C33 8 28 14 28 22 L26 36 L54 36 L52 22 C52 14 47 8 40 8Z" fill="#fce7f3" stroke="#fda4af" strokeWidth="1.5"/>
      <rect x="35" y="36" width="10" height="4" rx="2" fill="#fda4af" opacity="0.6"/>
      <circle cx="40" cy="42" r="3" fill="#fda4af"/>
      {/* Ripple dots */}
      <circle cx="57" cy="18" r="2.5" fill="#c4b5fd" opacity="0.8"/>
      <circle cx="63" cy="12" r="2" fill="#c4b5fd" opacity="0.5"/>
      <circle cx="23" cy="18" r="2.5" fill="#fda4af" opacity="0.8"/>
      <circle cx="17" cy="12" r="2" fill="#fda4af" opacity="0.5"/>
      {/* Notification badge */}
      <circle cx="52" cy="22" r="7" fill="url(#notifGrad)"/>
      <text x="49" y="25.5" fontSize="8" fill="white" fontFamily="sans-serif" fontWeight="bold">!</text>
      <defs>
        <linearGradient id="notifGrad" x1="45" y1="15" x2="59" y2="29">
          <stop stopColor="#fb7185"/><stop offset="1" stopColor="#a78bfa"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

const ILLUSTRATIONS = {
  gettingStarted: IllustrationGettingStarted,
  addingItems:    IllustrationAddItem,
  shoppingList:   IllustrationShopping,
  locations:      IllustrationLocations,
  aiScan:         IllustrationAIScan,
  tasks:          IllustrationTasks,
  notifications:  IllustrationNotifications,
}

// ─── Section component ────────────────────────────────────────
function HelpSection({ sectionKey, lang, isOpen, onToggle }) {
  const content   = HELP[sectionKey][lang]
  const Illus     = ILLUSTRATIONS[sectionKey]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-4 text-left focus:outline-none"
      >
        <div className="flex-shrink-0">
          <Illus />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-bold text-sm text-gray-800 dark:text-gray-100">{content.title}</p>
          <p className="font-sans text-xs text-gray-400 mt-0.5">{content.steps.length} steps</p>
        </div>
        <span className={`text-gray-300 dark:text-gray-600 text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-50 dark:border-gray-700/60 px-4 py-4 space-y-3 animate-fade-in">
          {content.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blush-100 to-lavender-100 dark:from-blush-500/20 dark:to-lavender-500/20 flex items-center justify-center flex-shrink-0 text-sm">
                {step.icon}
              </div>
              <p className="font-sans text-sm text-gray-600 dark:text-gray-300 pt-0.5 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────
export default function HelpPage() {
  const [lang,    setLang]    = useState(() => {
    try { return localStorage.getItem('help-lang') || 'en' } catch { return 'en' }
  })
  const [openKey, setOpenKey] = useState('gettingStarted')

  function toggleLang(l) {
    setLang(l)
    try { localStorage.setItem('help-lang', l) } catch {}
  }

  function toggleSection(key) {
    setOpenKey(prev => prev === key ? null : key)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 pb-10 pt-4 animate-fade-in">

      {/* Language toggle */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-sans font-bold text-base text-gray-800 dark:text-gray-100">
            {lang === 'en' ? 'How to use the app' : 'Paano gamitin ang app'}
          </h2>
          <p className="font-sans text-xs text-gray-400 mt-0.5">
            {lang === 'en' ? 'Tap any section to expand' : 'I-tap ang kahit anong seksyon para palawakin'}
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {[
            { id: 'en',  label: 'English' },
            { id: 'fil', label: 'Filipino' },
          ].map(l => (
            <button
              key={l.id}
              onClick={() => toggleLang(l.id)}
              className={`px-3 py-1.5 rounded-lg font-sans font-bold text-xs transition-all ${
                lang === l.id
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blush-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >{l.label}</button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {Object.keys(HELP).map(key => (
          <HelpSection
            key={key}
            sectionKey={key}
            lang={lang}
            isOpen={openKey === key}
            onToggle={() => toggleSection(key)}
          />
        ))}
      </div>

      {/* Footer tip */}
      <div className="mt-6 bg-gradient-to-r from-blush-50 to-lavender-50 dark:from-blush-500/10 dark:to-lavender-500/10 rounded-2xl px-4 py-3 text-center">
        <p className="font-sans text-xs text-gray-500 dark:text-gray-400">
          {lang === 'en'
            ? '💡 Tip: Add this app to your home screen for the best experience'
            : '💡 Tip: Idagdag ang app na ito sa iyong home screen para sa pinakamahusay na karanasan'}
        </p>
      </div>
    </div>
  )
}
