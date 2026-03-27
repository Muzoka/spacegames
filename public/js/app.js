/* ═══════════════════════════════════════
   SPACEGAMES - Main Client Application
   ═══════════════════════════════════════ */

window.SpaceGames = (() => {
  // ═══ INTERNATIONALIZATION ═══
  const LANGS = {
    ar: {
      nav_home:'الرئيسية', nav_leaderboard:'المتصدرين', nav_leave:'مغادرة',
      hero_title:'ساحة الألعاب', hero_subtitle:'منصة الألعاب والأدوات لمساحات X',
      hero_desc:'العب، نافس، وتابع النتائج — الكل في الوقت الحقيقي مع جمهور مساحتك',
      btn_create_room:'إنشاء غرفة', btn_join_room:'انضمام لغرفة', btn_send:'إرسال', btn_submit:'تأكيد',
      btn_continue:'متابعة', btn_rematch:'إعادة المباراة', btn_back:'→ العودة للغرفة',
      btn_end_game:'إنهاء اللعبة', btn_vote:'بدء تصويت', btn_tournament:'بطولة',
      chat_placeholder:'اكتب رسالة...', room_title:'الغرفة', room_code_label:'رمز الغرفة:',
      room_players:'👥 اللاعبون', room_start_game:'🎮 ابدأ لعبة', room_events:'🏟️ الفعاليات',
      room_debate:'⏱️ مؤقت النقاش', room_chat:'💬 الدردشة',
      room_link_copied:'تم نسخ رابط الغرفة!', room_code_copied:'تم نسخ رمز الغرفة!',
      feat_games:'٩ ألعاب ممتعة', feat_games_d:'إكس أو، صل ٤، شطرنج، حجر ورقة مقص، معلومات، كلمات، إيموجي، مشنوق، حساب',
      feat_debate:'مؤقت النقاش', feat_debate_d:'نقاشات منظمة مع توزيع عادل للوقت ولوحة متابعة مباشرة',
      feat_lb:'لوحة المتصدرين', feat_lb_d:'تتبع النتائج لكل لعبة وعالمياً — نافس لتكون رقم ١',
      feat_rt:'وقت حقيقي', feat_rt_d:'تزامن فوري لجميع اللاعبين — مثالي لمساحات X المباشرة',
      available_games:'الألعاب المتاحة',
      g_tictactoe:'إكس أو', g_connect4:'صل أربعة', g_chess:'شطرنج', g_rps:'حجر ورقة مقص',
      g_trivia:'تحدي المعلومات', g_wordscramble:'كلمات مبعثرة', g_emojiguess:'تخمين الإيموجي',
      g_hangman:'الرجل المشنوق', g_fastmath:'حساب سريع',
      gd_tictactoe:'لعبة الشبكة ٣×٣', gd_connect4:'صل ٤ في صف', gd_chess:'ملك الألعاب',
      gd_rps:'أفضل من ٥ جولات', gd_trivia:'١٠ أسئلة، كن الأسرع', gd_wordscramble:'رتب الحروف',
      gd_emojiguess:'فك شفرة الإيموجي', gd_hangman:'خمن الكلمة', gd_fastmath:'حساب بسرعة البرق',
      cat_strategy:'استراتيجية', cat_quick:'سريعة', cat_knowledge:'معرفة', cat_word:'كلمات', cat_fun:'مرح', cat_speed:'سرعة',
      players_label:'لاعبين', pts:'نقاط', you:'(أنت)', admin_badge:'مشرف', lvl:'مس.',
      your_turn:'دورك!', waiting_for:'بانتظار {name}...', spectating:'👁️ أنت تشاهد',
      round_of:'الجولة {n} من {t}', question_of:'السؤال {n} من {t}', word_of:'الكلمة {n} من {t}',
      puzzle_of:'اللغز {n} من {t}', problem_of:'المسألة {n} من {t}',
      solved_by:'حلها {name}!', times_up:'انتهى الوقت!', answer_was:'الجواب: {a}',
      type_answer:'اكتب إجابتك...', type_guess:'اكتب تخمينك...',
      you_win:'فزت! 🏆', winner_is:'فاز {name}!', its_draw:'تعادل!',
      well_played:'أحسنت!', next_time:'حظ أوفر المرة القادمة!', plus_pts:'+٣ نقاط، +٣٠ خبرة',
      rps_choose:'اختر سلاحك!', rps_rock:'حجر', rps_paper:'ورقة', rps_scissors:'مقص',
      rps_you_chose:'اخترت!', rps_waiting:'بانتظار الخصم...',
      hm_guess:'خمن حرفاً', hm_hint:'تلميح', hm_failed:'فشل! الكلمة كانت:',
      fm_easy:'سهل', fm_medium:'متوسط', fm_hard:'صعب', fm_challenge:'تحدي',
      debate_timer:'مؤقت النقاش', debate_topic:'الموضوع', debate_participants:'المشاركون',
      debate_time_per:'الوقت لكل شخص (ثوانٍ)', debate_create:'إنشاء نقاش',
      debate_speaking:'يتحدث', debate_controls:'🎛️ لوحة التحكم', debate_stats:'📊 الإحصائيات',
      debate_give_floor:'انقر على مشارك لإعطائه الكلمة:', debate_pause:'⏸ إيقاف مؤقت',
      debate_resume:'▶ استئناف', debate_stop:'⏹ إيقاف', debate_reset:'🔄 إعادة تعيين',
      debate_end:'إنهاء النقاش', debate_distribution:'توزيع وقت التحدث',
      debate_used:'مستخدم', debate_total:'إجمالي', debate_active:'نقاش نشط:',
      debate_open:'فتح لوحة النقاش', debate_view:'عرض لوحة النقاش',
      lb_title:'🏆 لوحة المتصدرين العالمية', lb_all:'كل الألعاب',
      lb_rank:'الترتيب', lb_player:'اللاعب', lb_played:'لُعبت', lb_wins:'فوز', lb_wld:'ف / خ / ت', lb_points:'النقاط',
      lb_empty:'لا توجد نتائج بعد. العب لتظهر في القائمة!', lb_error:'فشل تحميل المتصدرين',
      modal_name:'اسمك', modal_enter_name:'أدخل اسمك', modal_room_code:'رمز الغرفة',
      modal_name_req:'الرجاء إدخال اسمك', modal_code_req:'الرجاء إدخال رمز الغرفة',
      vote_next:'صوّت للعبة القادمة:', vote_result:'نتيجة التصويت:', vote_started:'بدأ التصويت!',
      tourn_title:'بدء بطولة', tourn_game:'نوع اللعبة', tourn_start:'🏆 ابدأ البطولة',
      tourn_desc:'بطولة خروج مباشر مع جميع لاعبي الغرفة.',
      tourn_wins:'🏆 فاز {name} بالبطولة!', tourn_r1:'الجولة ١', tourn_quarter:'ربع النهائي',
      tourn_semi:'نصف النهائي', tourn_final:'النهائي', tourn_champion:'البطل', tourn_bye:'تأهل تلقائي',
      profile_avatar:'اختر صورتك',
      ach_unlocked:'إنجاز جديد!',
      joined_room:'انضم {name} للغرفة', left_room:'غادر لاعب الغرفة',
      now_admin:'أنت الآن مشرف الغرفة!', kicked:'تم طردك من الغرفة', player_kicked:'تم طرد اللاعب',
      need_players:'تحتاج على الأقل {n} لاعبين',
      btn_add_bot:'إضافة بوت', btn_remove_bots:'إزالة كل البوتات',
      bot_easy:'بوت سهل', bot_medium:'بوت متوسط', bot_hard:'بوت صعب', bot_badge:'بوت',
      theme_select:'اختيار المظهر', title_select:'اختيار اللقب', title_none:'بدون لقب',
      daily_title:'التحدي اليومي', daily_reward:'المكافأة', daily_complete:'أحسنت! تم إكمال التحدي',
      btn_share:'شارك على X', btn_start_game:'🎮 ابدأ اللعبة',
      gs_settings:'إعدادات اللعبة', gs_timer:'المؤقت', gs_seconds:'ثوانٍ', gs_rounds:'عدد الجولات',
      gs_select_players:'اختر اللاعبين', gs_select_2:'اختر لاعبين اثنين',
      profile_winrate:'نسبة الفوز', profile_favgame:'اللعبة المفضلة', profile_maxstreak:'أعلى سلسلة',
      profile_achievements:'الإنجازات', profile_none_yet:'لا يوجد بعد',
      lang_toggle:'EN', debate_created:'تم إنشاء النقاش!',
      quick_play:'العب الآن', quick_play_desc:'اختر لعبة وابدأ فوراً ضد بوت',
      pick_game:'اختر لعبة', pick_difficulty:'اختر المستوى',
      solo_play:'لعب فردي', vs_bot:'ضد البوت',
      vs:'ضد', score:'النتيجة', win:'فوز!', lose:'خسارة!', draw:'تعادل!',
      reconnecting:'جارٍ إعادة الاتصال...', reconnected:'تم إعادة الاتصال'
    },
    en: {
      nav_home:'Home', nav_leaderboard:'Leaderboard', nav_leave:'Leave',
      hero_title:'SpaceGames', hero_subtitle:'The ultimate games & tools platform for X Spaces',
      hero_desc:'Play games, host debates, track scores — all in real-time with your Space audience',
      btn_create_room:'Create Room', btn_join_room:'Join Room', btn_send:'Send', btn_submit:'Submit',
      btn_continue:'Continue', btn_rematch:'Rematch', btn_back:'← Back to Room',
      btn_end_game:'End Game', btn_vote:'Start Vote', btn_tournament:'Tournament',
      chat_placeholder:'Type a message...', room_title:'Room', room_code_label:'Room Code:',
      room_players:'👥 Players', room_start_game:'🎮 Start a Game', room_events:'🏟️ Events',
      room_debate:'⏱️ Debate Timer', room_chat:'💬 Chat',
      room_link_copied:'Room link copied!', room_code_copied:'Room code copied!',
      feat_games:'9 Fun Games', feat_games_d:'XO, Connect 4, Chess, RPS, Trivia, Word Scramble, Emoji Guess, Hangman, Fast Math',
      feat_debate:'Debate Timer', feat_debate_d:'Structured discussions with fair time allocation and live dashboard',
      feat_lb:'Leaderboard', feat_lb_d:'Track scores per game and globally — compete to be #1',
      feat_rt:'Real-Time', feat_rt_d:'Instant sync for all players — perfect for live X Spaces',
      available_games:'Available Games',
      g_tictactoe:'Tic Tac Toe', g_connect4:'Connect Four', g_chess:'Chess', g_rps:'Rock Paper Scissors',
      g_trivia:'Trivia Battle', g_wordscramble:'Word Scramble', g_emojiguess:'Emoji Guess',
      g_hangman:'Hangman', g_fastmath:'Fast Math',
      gd_tictactoe:'Classic 3x3 grid', gd_connect4:'Get 4 in a row', gd_chess:'The king of games',
      gd_rps:'Best of 5 showdown', gd_trivia:'10 questions, be fastest', gd_wordscramble:'Unscramble the word',
      gd_emojiguess:'Decode the emojis', gd_hangman:'Guess the word', gd_fastmath:'Speed arithmetic',
      cat_strategy:'Strategy', cat_quick:'Quick', cat_knowledge:'Knowledge', cat_word:'Word', cat_fun:'Fun', cat_speed:'Speed',
      players_label:'players', pts:'pts', you:'(you)', admin_badge:'ADMIN', lvl:'Lv.',
      your_turn:'Your turn!', waiting_for:'Waiting for {name}...', spectating:'👁️ You are spectating',
      round_of:'Round {n} of {t}', question_of:'Question {n} of {t}', word_of:'Word {n} of {t}',
      puzzle_of:'Puzzle {n} of {t}', problem_of:'Problem {n} of {t}',
      solved_by:'Solved by {name}!', times_up:"Time's up!", answer_was:'Answer: {a}',
      type_answer:'Type your answer...', type_guess:'Type your guess...',
      you_win:'You Win! 🏆', winner_is:'{name} Wins!', its_draw:"It's a Draw!",
      well_played:'Well played!', next_time:'Better luck next time!', plus_pts:'+3 points, +30 XP',
      rps_choose:'Choose your weapon!', rps_rock:'Rock', rps_paper:'Paper', rps_scissors:'Scissors',
      rps_you_chose:'You chose!', rps_waiting:'Waiting for opponent...',
      hm_guess:'Guess a letter', hm_hint:'Hint', hm_failed:'Failed! The word was:',
      fm_easy:'Easy', fm_medium:'Medium', fm_hard:'Hard', fm_challenge:'Challenge',
      debate_timer:'Debate Timer', debate_topic:'Topic', debate_participants:'Participants',
      debate_time_per:'Time Per Person (seconds)', debate_create:'Create Debate',
      debate_speaking:'SPEAKING', debate_controls:'🎛️ Controls', debate_stats:'📊 Statistics',
      debate_give_floor:'Click a participant to give them the floor:', debate_pause:'⏸ Pause',
      debate_resume:'▶ Resume', debate_stop:'⏹ Stop', debate_reset:'🔄 Reset',
      debate_end:'End Debate', debate_distribution:'Speaking Distribution',
      debate_used:'used', debate_total:'total', debate_active:'Active debate:',
      debate_open:'Open Debate Dashboard', debate_view:'View Debate Dashboard',
      lb_title:'🏆 Global Leaderboard', lb_all:'All Games',
      lb_rank:'Rank', lb_player:'Player', lb_played:'Played', lb_wins:'Wins', lb_wld:'W / L / D', lb_points:'Points',
      lb_empty:'No scores yet. Play some games to get on the board!', lb_error:'Failed to load leaderboard',
      modal_name:'Your Name', modal_enter_name:'Enter your name', modal_room_code:'Room Code',
      modal_name_req:'Please enter your name', modal_code_req:'Please enter room code',
      vote_next:'Vote for next game:', vote_result:'Vote Result:', vote_started:'Vote started!',
      tourn_title:'Start Tournament', tourn_game:'Game Type', tourn_start:'🏆 Start Tournament',
      tourn_desc:'Single elimination bracket with all room players.',
      tourn_wins:'🏆 {name} wins the tournament!', tourn_r1:'Round 1', tourn_quarter:'Quarter',
      tourn_semi:'Semi', tourn_final:'Final', tourn_champion:'Champion', tourn_bye:'BYE',
      profile_avatar:'Choose Avatar',
      ach_unlocked:'Achievement Unlocked!',
      joined_room:'{name} joined the room', left_room:'A player left the room',
      now_admin:'You are now the room admin!', kicked:'You have been kicked from the room', player_kicked:'Player kicked',
      need_players:'Need at least {n} players',
      btn_add_bot:'Add Bot', btn_remove_bots:'Remove All Bots',
      bot_easy:'Easy Bot', bot_medium:'Medium Bot', bot_hard:'Hard Bot', bot_badge:'BOT',
      theme_select:'Choose Theme', title_select:'Select Title', title_none:'No Title',
      daily_title:'Daily Challenge', daily_reward:'Reward', daily_complete:'Nice! Challenge completed',
      btn_share:'Share to X', btn_start_game:'🎮 Start Game',
      gs_settings:'Game Settings', gs_timer:'Timer', gs_seconds:'seconds', gs_rounds:'Rounds',
      gs_select_players:'Select Players', gs_select_2:'Select exactly 2 players',
      profile_winrate:'Win Rate', profile_favgame:'Favorite Game', profile_maxstreak:'Max Streak',
      profile_achievements:'Achievements', profile_none_yet:'None yet',
      lang_toggle:'عربي', debate_created:'Debate created!',
      quick_play:'Play Now', quick_play_desc:'Pick a game and start instantly vs a bot',
      pick_game:'Pick a Game', pick_difficulty:'Pick Difficulty',
      solo_play:'Solo Play', vs_bot:'vs Bot',
      vs:'vs', score:'Score', win:'Win!', lose:'Loss!', draw:'Draw!',
      reconnecting:'Reconnecting...', reconnected:'Reconnected'
    }
  };

  let lang = localStorage.getItem('sg_lang') || 'ar';

  function t(key, vars) {
    let s = (LANGS[lang] && LANGS[lang][key]) || (LANGS.en[key]) || key;
    if (vars) { for (const [k, v] of Object.entries(vars)) s = s.replace('{' + k + '}', v); }
    return s;
  }

  function setLang(l) {
    lang = l;
    localStorage.setItem('sg_lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('lang-toggle').textContent = t('lang_toggle');
    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    // Re-render dynamic content
    renderHomeGames();
    if (currentRoom) renderRoom();
    renderLeaderboardFilters();
  }

  function toggleLang() {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }

  // ─── Themes ───
  const THEMES = {
    midnight:{ icon:'🟣', en:'Midnight Purple', ar:'بنفسجي' },
    ocean:{ icon:'🔵', en:'Ocean Blue', ar:'أزرق' },
    emerald:{ icon:'🟢', en:'Emerald', ar:'أخضر' },
    abyss:{ icon:'⚫', en:'Pure Black', ar:'أسود' }
  };
  let currentTheme = localStorage.getItem('sg_theme') || 'midnight';
  function applyTheme(id) { currentTheme = id; localStorage.setItem('sg_theme', id); document.documentElement.setAttribute('data-theme', id); }
  function showThemePicker() {
    const html = Object.entries(THEMES).map(([id, th]) =>
      `<div class="theme-option ${id===currentTheme?'selected':''}" onclick="SpaceGames.setTheme('${id}')">${th.icon} <span>${lang==='ar'?th.ar:th.en}</span></div>`
    ).join('');
    openModal(t('theme_select'), `<div class="theme-grid">${html}</div>`);
  }
  function setTheme(id) { applyTheme(id); closeModal(); }

  // ─── Achievements client reference ───
  const ACHS_CLIENT = [
    {id:'first_blood',icon:'🗡️',en:'First Blood',ar:'الضربة الأولى'},{id:'streak_3',icon:'🔥',en:'Streak Starter',ar:'بداية السلسلة'},
    {id:'streak_5',icon:'🔥🔥',en:'On Fire',ar:'مشتعل'},{id:'streak_10',icon:'💥',en:'Unstoppable',ar:'لا يُوقف'},
    {id:'checkmate',icon:'♟️',en:'Checkmate',ar:'كش ملك'},{id:'trivia_king',icon:'🧠',en:'Trivia King',ar:'ملك المعلومات'},
    {id:'word_wizard',icon:'🔤',en:'Word Wizard',ar:'ساحر الكلمات'},{id:'emoji_expert',icon:'😎',en:'Emoji Expert',ar:'خبير الإيموجي'},
    {id:'speed_demon',icon:'⚡',en:'Speed Demon',ar:'شيطان السرعة'},{id:'jack_trades',icon:'🃏',en:'All-Rounder',ar:'متعدد المواهب'},
    {id:'social',icon:'🦋',en:'Social Star',ar:'نجم اجتماعي'},{id:'debater',icon:'🎙️',en:'Debater',ar:'المناظر'},
    {id:'champion',icon:'👑',en:'Champion',ar:'البطل'},{id:'veteran',icon:'⭐',en:'Veteran',ar:'محارب قديم'},
    {id:'legend',icon:'🏆',en:'Legend',ar:'أسطورة'}
  ];
  function getAchIcon(id) { const a = ACHS_CLIENT.find(x => x.id === id); return a ? a.icon : ''; }
  function getAchName(id) { const a = ACHS_CLIENT.find(x => x.id === id); return a ? (lang === 'ar' ? a.ar : a.en) : id; }
  function getTitleDisplay(titleId) { const a = ACHS_CLIENT.find(x => x.id === titleId); return a ? a.icon + ' ' + (lang === 'ar' ? a.ar : a.en) : ''; }

  // ─── State ───
  let socket = null;
  let playerId = null;
  let playerName = localStorage.getItem('sg_playerName') || '';
  let playerAvatar = localStorage.getItem('sg_avatar') || '😎';
  let playerLevel = 1;
  let playerProfile = null;
  let currentRoom = null;
  let isAdmin = false;
  let soundEnabled = localStorage.getItem('sg_sound') !== 'off';
  let lastGameType = null;
  const registeredGames = {};

  // ─── Game Registry (uses t() for i18n) ───
  function getGameInfo() {
    return {
      tictactoe:    { name: t('g_tictactoe'),    icon: '❌⭕', desc: t('gd_tictactoe'),    min: 2, max: 2, category: t('cat_strategy') },
      connect4:     { name: t('g_connect4'),      icon: '🔴🟡', desc: t('gd_connect4'),     min: 2, max: 2, category: t('cat_strategy') },
      chess:        { name: t('g_chess'),          icon: '♟️♚',  desc: t('gd_chess'),        min: 2, max: 2, category: t('cat_strategy') },
      rps:          { name: t('g_rps'),            icon: '🪨📄✂️', desc: t('gd_rps'),       min: 2, max: 2, category: t('cat_quick') },
      trivia:       { name: t('g_trivia'),         icon: '🧠🎯', desc: t('gd_trivia'),      min: 2, max: 20, category: t('cat_knowledge') },
      wordscramble: { name: t('g_wordscramble'),   icon: '🔤🔀', desc: t('gd_wordscramble'),min: 2, max: 20, category: t('cat_word') },
      emojiguess:   { name: t('g_emojiguess'),     icon: '😎🤔', desc: t('gd_emojiguess'),  min: 2, max: 20, category: t('cat_fun') },
      hangman:      { name: t('g_hangman'),         icon: '🪢💀', desc: t('gd_hangman'),     min: 2, max: 20, category: t('cat_word') },
      fastmath:     { name: t('g_fastmath'),        icon: '🔢⚡', desc: t('gd_fastmath'),   min: 2, max: 20, category: t('cat_speed') }
    };
  }
  // Keep a reference for backward compat
  const gameInfo = getGameInfo();

  // ─── Sound Effects System ───
  const audioCtx = typeof AudioContext !== 'undefined' ? new AudioContext() : null;

  function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.15;
    const now = audioCtx.currentTime;
    switch (type) {
      case 'move': osc.frequency.value = 600; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1); break;
      case 'win': osc.type = 'square'; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.1); osc.frequency.setValueAtTime(784, now + 0.2); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); osc.start(now); osc.stop(now + 0.4); break;
      case 'lose': osc.type = 'sawtooth'; gain.gain.value = 0.1; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(200, now + 0.3); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); osc.start(now); osc.stop(now + 0.4); break;
      case 'tick': osc.frequency.value = 800; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05); break;
      case 'join': osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); osc.start(now); osc.stop(now + 0.2); break;
      case 'achievement': osc.type = 'square'; gain.gain.value = 0.12; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.15); osc.frequency.setValueAtTime(784, now + 0.3); osc.frequency.setValueAtTime(1047, now + 0.45); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7); osc.start(now); osc.stop(now + 0.7); break;
      default: osc.frequency.value = 500; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('sg_sound', soundEnabled ? 'on' : 'off');
    document.getElementById('sound-toggle').textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) playSound('join');
  }

  // ─── Confetti ───
  function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#f97316'];
    for (let i = 0; i < 120; i++) {
      particles.push({ x: Math.random() * canvas.width, y: -20, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 4 + 2, size: Math.random() * 8 + 3, color: colors[Math.floor(Math.random() * colors.length)], rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10 });
    }
    let frame = 0;
    function animate() {
      if (frame > 120) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rotation += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      frame++;
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ─── Initialize ───
  function init() {
    socket = io({ reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 20 });
    setupSocketListeners();
    setupReconnection();
    setLang(lang);
    applyTheme(currentTheme);
    handleHash();
    window.addEventListener('hashchange', handleHash);
    document.getElementById('sound-toggle').textContent = soundEnabled ? '🔊' : '🔇';
    // Show welcome for first-time users
    if (!localStorage.getItem('sg_welcomed')) showWelcome();
  }

  function setupReconnection() {
    const banner = document.getElementById('reconnect-banner');
    socket.on('disconnect', () => {
      if (banner) banner.style.display = 'flex';
    });
    socket.on('reconnect', () => {
      if (banner) banner.style.display = 'none';
      toast(lang === 'ar' ? 'تم إعادة الاتصال' : 'Reconnected', 'success');
      // Re-join room if we were in one
      if (currentRoom && playerName) {
        socket.emit('rejoin-room', { roomCode: currentRoom.code, playerName }, (res) => {
          if (res && res.success) {
            playerId = res.playerId;
            currentRoom = res.room;
            isAdmin = res.isAdmin || currentRoom.admin === playerId;
            renderRoom();
          }
        });
      }
    });
  }

  // ─── Welcome Overlay ───
  function showWelcome() {
    const steps = lang === 'ar' ? [
      { icon: '🎮', title: 'العب فوراً', desc: 'اختر لعبة وابدأ ضد البوت بنقرة واحدة' },
      { icon: '👥', title: 'ادعُ أصدقاءك', desc: 'أنشئ غرفة وشارك الرمز في مساحة X' },
      { icon: '🏆', title: 'نافس وتصدّر', desc: 'اربح XP وألقاب وتسلق لوحة المتصدرين' }
    ] : [
      { icon: '🎮', title: 'Play Instantly', desc: 'Pick a game and start vs a bot in one tap' },
      { icon: '👥', title: 'Invite Friends', desc: 'Create a room and share the code in your X Space' },
      { icon: '🏆', title: 'Compete & Rise', desc: 'Earn XP, titles, and climb the leaderboard' }
    ];
    const stepsHtml = steps.map(s => `<div class="welcome-step"><div class="ws-icon">${s.icon}</div><div class="ws-title">${s.title}</div><div class="ws-desc">${s.desc}</div></div>`).join('');
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) {
      overlay.innerHTML = `<div class="welcome-content"><h2 class="gradient-text" style="font-size:2rem;margin-bottom:4px;">SpaceGames</h2><p style="color:var(--text-muted);margin-bottom:24px;">${lang === 'ar' ? 'مرحباً بك في ساحة الألعاب' : 'Welcome to the arena'}</p><div class="welcome-steps">${stepsHtml}</div><button class="btn btn-accent btn-lg" style="width:100%;justify-content:center;margin-top:20px;" onclick="SpaceGames.dismissWelcome()">${lang === 'ar' ? 'يلا نلعب! 🚀' : "Let's Play! 🚀"}</button></div>`;
      overlay.style.display = 'flex';
    }
  }

  function dismissWelcome() {
    localStorage.setItem('sg_welcomed', '1');
    const overlay = document.getElementById('welcome-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function renderLeaderboardFilters() {
    const el = document.getElementById('leaderboard-filters');
    if (!el) return;
    const gi = getGameInfo();
    const filters = [{ key: 'all', label: t('lb_all') }];
    for (const [id, g] of Object.entries(gi)) filters.push({ key: id, label: g.name });
    el.innerHTML = filters.map(f => `<button onclick="SpaceGames.loadLeaderboard('${f.key}')" class="btn btn-sm filter-btn${f.key === 'all' ? ' active' : ''}" data-filter="${f.key}">${f.label}</button>`).join('');
  }

  // ─── Navigation ───
  function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (link) link.classList.add('active');

    if (page === 'leaderboard') loadLeaderboard('all');
  }

  function handleHash() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('/room/')) {
      const code = hash.split('/')[2];
      if (code && !currentRoom) showJoinRoom(code);
    }
  }

  // ─── Room Management ───
  function showCreateRoom() {
    openModal(t('btn_create_room'), `
      <div class="input-group">
        <label>${t('modal_name')}</label>
        <input type="text" id="create-name" value="${playerName}" placeholder="${t('modal_enter_name')}" maxlength="20">
      </div>
      <button onclick="SpaceGames.createRoom()" class="btn btn-primary btn-lg">🚀 ${t('btn_create_room')}</button>
    `);
    setTimeout(() => { const input = document.getElementById('create-name'); if (input && !input.value) input.focus(); }, 100);
  }

  function showJoinRoom(prefillCode) {
    openModal(t('btn_join_room'), `
      <div class="input-group">
        <label>${t('modal_room_code')}</label>
        <input type="text" id="join-code" value="${prefillCode || ''}" placeholder="XXXXXX" maxlength="6" style="text-transform:uppercase; text-align:center; font-size:1.3rem; letter-spacing:4px; font-family:var(--font-mono);">
      </div>
      <div class="input-group">
        <label>${t('modal_name')}</label>
        <input type="text" id="join-name" value="${playerName}" placeholder="${t('modal_enter_name')}" maxlength="20">
      </div>
      <button onclick="SpaceGames.joinRoom()" class="btn btn-primary btn-lg">🔗 ${t('btn_join_room')}</button>
    `);
    setTimeout(() => { const input = document.getElementById(prefillCode ? 'join-name' : 'join-code'); if (input && !input.value) input.focus(); }, 100);
  }

  function createRoom() {
    const name = document.getElementById('create-name').value.trim();
    if (!name) return toast(t('modal_name_req'), 'error');
    playerName = name;
    localStorage.setItem('sg_playerName', name);

    socket.emit('create-room', { playerName: name }, (res) => {
      if (res.error) return toast(res.error, 'error');
      playerId = res.playerId;
      currentRoom = res.room;
      isAdmin = true;
      if (res.profile) { playerProfile = res.profile; playerAvatar = res.profile.avatar; playerLevel = res.profile.level; localStorage.setItem('sg_avatar', playerAvatar); }
      closeModal();
      enterRoom();
      playSound('join');
      renderDailyChallenge();
    });
  }

  function joinRoom() {
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    const name = document.getElementById('join-name').value.trim();
    if (!code) return toast(t('modal_code_req'), 'error');
    if (!name) return toast(t('modal_name_req'), 'error');
    playerName = name;
    localStorage.setItem('sg_playerName', name);

    socket.emit('join-room', { roomCode: code, playerName: name }, (res) => {
      if (res.error) return toast(res.error, 'error');
      playerId = res.playerId;
      currentRoom = res.room;
      isAdmin = currentRoom.admin === playerId;
      if (res.profile) { playerProfile = res.profile; playerAvatar = res.profile.avatar; playerLevel = res.profile.level; localStorage.setItem('sg_avatar', playerAvatar); }
      closeModal();
      enterRoom();
      playSound('join');
    });
  }

  function enterRoom() {
    navigate('room');
    location.hash = '/room/' + currentRoom.code;
    document.getElementById('nav-user').style.display = 'flex';
    document.getElementById('nav-room-code').textContent = currentRoom.code;
    document.getElementById('nav-player-name').textContent = playerName;
    document.getElementById('nav-avatar').textContent = playerAvatar;
    const lvlEl = document.getElementById('nav-level');
    lvlEl.textContent = 'Lv.' + playerLevel;
    lvlEl.className = 'level-badge' + (playerLevel >= 10 ? ' elite' : playerLevel >= 5 ? ' high' : '');
    renderRoom();
  }

  function leaveRoom() {
    socket.emit('leave-room');
    currentRoom = null;
    isAdmin = false;
    playerId = null;
    document.getElementById('nav-user').style.display = 'none';
    location.hash = '';
    navigate('home');
  }

  function renderRoom() {
    if (!currentRoom) return;
    const r = currentRoom;

    document.getElementById('room-title').textContent = isAdmin ? 'Your Room' : 'Room';
    document.getElementById('room-code-big').textContent = r.code;
    document.getElementById('room-player-count').textContent = `${r.players.length} ${t('players_label')}`;

    // Players with rank colors
    const sortedByScore = [...r.players].sort((a, b) => b.score - a.score);
    const rankMap = {}; sortedByScore.forEach((p, i) => { rankMap[p.id] = i + 1; });
    const playersHtml = r.players.map(p => {
      const isBotP = p.isBot;
      const rank = rankMap[p.id] || 99;
      return `<div class="player-tag ${p.id === r.admin ? 'admin' : ''} ${isBotP ? 'bot-player' : ''}" data-rank="${rank <= 3 ? rank : ''}" data-elite="${(p.level || 0) >= 10}">
        <span class="pt-avatar">${isBotP ? '🤖' : (p.avatar || '😎')}</span>
        <span class="player-name-link" onclick="SpaceGames.showPlayerProfile('${escHtml(p.name)}')">${escHtml(p.name)}</span>
        ${p.selectedTitle ? '<span class="player-title-badge">' + getTitleDisplay(p.selectedTitle) + '</span>' : ''}
        ${p.id === r.admin ? '<span class="admin-badge">' + t('admin_badge') + '</span>' : ''}
        ${isBotP ? '<span class="bot-badge">' + t('bot_badge') + ' ' + (p.difficulty==='easy'?'🟢':p.difficulty==='hard'?'🔴':'🟡') + '</span>' : ''}
        ${p.level && !isBotP ? '<span class="pt-level">' + t('lvl') + p.level + '</span>' : ''}
        <span class="score-badge">${p.score} ${t('pts')}</span>
        ${p.id === playerId ? '<span style="color:var(--primary);font-size:0.7rem">' + t('you') + '</span>' : ''}
        ${isAdmin && !isBotP && p.id !== playerId ? '<span class="pt-kick" onclick="SpaceGames.kickPlayer(\'' + p.id + '\')" title="Kick">🚫</span>' : ''}
        ${isAdmin && isBotP ? '<span class="pt-kick" onclick="SpaceGames.removeBot(\'' + p.id + '\')" title="Remove">🗑️</span>' : ''}
      </div>`;
    }).join('');
    document.getElementById('room-players').innerHTML = playersHtml;

    // Bot controls (admin only)
    const botSection = document.getElementById('room-bot-section');
    if (botSection) {
      if (isAdmin) {
        botSection.style.display = '';
        document.getElementById('bot-controls').innerHTML = `
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick="SpaceGames.addBot('easy')" class="btn btn-sm btn-success">🟢 ${t('bot_easy')}</button>
            <button onclick="SpaceGames.addBot('medium')" class="btn btn-sm btn-secondary">🟡 ${t('bot_medium')}</button>
            <button onclick="SpaceGames.addBot('hard')" class="btn btn-sm btn-danger">🔴 ${t('bot_hard')}</button>
          </div>
          <button onclick="SpaceGames.removeAllBots()" class="btn btn-sm btn-ghost" style="margin-top:8px;">🗑️ ${t('btn_remove_bots')}</button>`;
      } else {
        botSection.style.display = 'none';
      }
    }

    // Events section (vote/tournament) - admin only
    const specialSection = document.getElementById('room-special-section');
    if (specialSection) {
      document.getElementById('btn-create-vote').style.display = isAdmin ? '' : 'none';
      document.getElementById('btn-start-tournament').style.display = isAdmin ? '' : 'none';
      if (r.tournament) renderTournamentBracket(r.tournament, 'tournament-display');
    }

    // Games section (admin only)
    const gamesSection = document.getElementById('room-games-section');
    if (isAdmin) {
      gamesSection.style.display = '';
      const gi = getGameInfo();
      const gamesHtml = Object.entries(gi).map(([id, g]) => `
        <button class="mini-game-btn" onclick="SpaceGames.startGame('${id}')">
          <span class="mg-icon">${g.icon}</span>
          <span class="mg-name">${g.name}</span>
          <span class="mg-players">${g.min === g.max ? g.min : g.min + '-' + g.max} ${t('players_label')}</span>
        </button>
      `).join('');
      document.getElementById('room-games-grid').innerHTML = gamesHtml;
    } else {
      gamesSection.style.display = 'none';
    }

    // Debate section (admin only)
    const debateSection = document.getElementById('room-debate-section');
    if (isAdmin) {
      debateSection.style.display = '';
      if (r.debate) {
        document.getElementById('debate-controls').innerHTML = `
          <p style="margin-bottom:12px;color:var(--text-muted)">Active debate: <strong>${r.debate.topic}</strong></p>
          <button class="btn btn-primary" onclick="SpaceGames.openDebate()">Open Debate Dashboard</button>
        `;
      } else {
        document.getElementById('debate-controls').innerHTML = `
          <button class="btn btn-accent" onclick="SpaceGames.showCreateDebate()">Create Debate</button>
        `;
      }
    } else {
      if (r.debate) {
        debateSection.style.display = '';
        document.getElementById('debate-controls').innerHTML = `
          <p style="margin-bottom:12px;color:var(--text-muted)">Active debate: <strong>${r.debate.topic}</strong></p>
          <button class="btn btn-secondary" onclick="SpaceGames.openDebate()">View Debate Dashboard</button>
        `;
      } else {
        debateSection.style.display = 'none';
      }
    }
  }

  function copyRoomCode() {
    if (!currentRoom) return;
    const url = location.origin + '/#/room/' + currentRoom.code;
    navigator.clipboard.writeText(url).then(() => toast(t('room_link_copied'), 'success')).catch(() => {
      navigator.clipboard.writeText(currentRoom.code).then(() => toast(t('room_code_copied'), 'success'));
    });
  }

  // ─── Chat ───
  function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    socket.emit('chat-message', { message: msg });
    input.value = '';
  }

  function addChatMessage(data) {
    const el = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<span class="chat-name">${escHtml(data.playerName)}</span><span class="chat-text">${escHtml(data.message)}</span>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function addSystemMessage(text) {
    const el = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg system';
    div.textContent = text;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  // ─── Reactions ───
  function sendReaction(emoji) {
    socket.emit('send-reaction', { emoji });
  }

  function showReaction(data) {
    const container = document.getElementById('reaction-container');
    const el = document.createElement('div');
    el.className = 'floating-reaction';
    el.textContent = data.emoji;
    el.style.left = (20 + Math.random() * 60) + '%';
    el.style.bottom = '10%';
    container.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  // ─── Games ───
  function registerGame(id, handler) {
    registeredGames[id] = handler;
  }

  function startGame(gameType) {
    if (!isAdmin || !currentRoom) return;
    const gi = getGameInfo();
    const info = gi[gameType];
    if (!info) return;
    if (currentRoom.players.length < info.min) {
      return toast(t('need_players', { n: info.min }), 'error');
    }
    showGameSettings(gameType, info);
  }

  function onGameStarted(data) {
    const { gameType, state, players, gamePlayers } = data;
    const info = gameInfo[gameType];
    if (!info) return;

    navigate('game');
    document.getElementById('game-title').textContent = info.icon + ' ' + info.name;

    const isPlayer = gamePlayers.includes(playerId);
    document.getElementById('game-spectator-bar').style.display = isPlayer ? 'none' : '';
    document.getElementById('btn-end-game').style.display = isAdmin ? '' : 'none';

    // Timer display
    const timerDisp = document.getElementById('game-timer-display');
    if (['trivia', 'wordscramble', 'emojiguess'].includes(gameType)) {
      timerDisp.style.display = 'flex';
    } else {
      timerDisp.style.display = 'none';
    }

    const container = document.getElementById('game-container');
    container.innerHTML = '';

    const handler = registeredGames[gameType];
    if (handler) {
      handler.init(container, { socket, playerId, playerName, isAdmin, gameState: state, players, gamePlayers, gameInfo: info });
    }
  }

  function onGameUpdate(data) {
    const handler = currentRoom && registeredGames[currentRoom.currentGame || ''];
    // We might be in game view even though room.currentGame was cleared
    const activeGame = document.getElementById('page-game').classList.contains('active');
    if (activeGame) {
      // Find the active handler by checking which game was initialized
      for (const [id, h] of Object.entries(registeredGames)) {
        if (h._active) { h.onUpdate(data); break; }
      }
    }
  }

  function onGameOver(data) {
    for (const [id, h] of Object.entries(registeredGames)) {
      if (h._active) { h._active = false; break; }
    }
    showGameOverScreen(data);
  }

  function showGameOverScreen(data) {
    _lastGameResult = data;
    const overlay = document.getElementById('game-over-overlay');
    overlay.style.display = 'flex';
    const container = document.getElementById('podium-container');
    const pp = data.podiumPlayers || {};
    const gi = getGameInfo();
    const isMulti = data.scores && Object.keys(data.scores).length > 2;

    let html = '<div class="podium-wrapper">';

    // Result text
    if (data.draw) {
      html += `<div class="podium-result-text">🤝 ${t('its_draw')}</div>`;
      playSound('tick');
    } else if (data.winner === playerId) {
      html += `<div class="podium-result-text" style="color:var(--accent)">🏆 ${t('you_win')}</div>`;
      playSound('win');
      fireConfetti();
    } else {
      html += `<div class="podium-result-text">😢 ${t('winner_is', { name: data.winnerName || '?' })}</div>`;
      playSound('lose');
    }

    if (isMulti && data.scores) {
      // Kahoot-style podium for multiplayer
      const sorted = Object.entries(data.scores).sort((a, b) => b[1] - a[1]);
      const top3 = sorted.slice(0, 3);
      const medals = ['gold', 'silver', 'bronze'];
      // Reorder for visual: [2nd, 1st, 3rd]
      const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];

      html += '<div class="podium-stage">';
      podiumOrder.forEach(([pid, score], i) => {
        const p = pp[pid] || { name: data.playerNames[pid] || '?', avatar: '😎' };
        const actualRank = top3.findIndex(([id]) => id === pid);
        const medal = medals[actualRank] || 'bronze';
        const rank = actualRank + 1;
        html += `<div class="podium-place" id="podium-${i}" style="transition-delay:${(2 - i) * 0.4}s">
          <div class="podium-avatar">${p.avatar || '😎'}</div>
          <div class="podium-name">${escHtml(p.name)}</div>
          <div class="podium-pts">${score}</div>
          <div class="podium-bar ${medal}"><span class="podium-rank">#${rank}</span></div>
        </div>`;
      });
      html += '</div>';

      // Full scoreboard
      html += '<div class="podium-scorelist">';
      sorted.forEach(([pid, score], i) => {
        const p = pp[pid] || { name: data.playerNames[pid] || '?' };
        html += `<div class="podium-score-row"><span class="psr-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1)}</span><span class="psr-name">${escHtml(p.name)}</span><span class="psr-pts">${score}</span></div>`;
      });
      html += '</div>';
    } else {
      // VS result for 2-player games
      const pids = Object.keys(pp);
      if (pids.length >= 2) {
        html += '<div class="vs-result">';
        pids.forEach((pid, i) => {
          const p = pp[pid];
          const isW = pid === data.winner;
          const isL = data.winner && pid !== data.winner;
          html += `<div class="vs-player ${isW ? 'winner' : ''} ${isL ? 'loser' : ''}">
            <div class="vs-avatar">${p.avatar || '😎'}</div>
            <div class="vs-name">${escHtml(p.name)}</div>
          </div>`;
          if (i === 0 && pids.length > 1) html += `<div class="vs-separator">${t('vs')}</div>`;
        });
        html += '</div>';
      }
    }

    html += '</div>';
    container.innerHTML = html;

    // Staggered podium reveal
    setTimeout(() => {
      document.querySelectorAll('.podium-place').forEach(el => el.classList.add('revealed'));
    }, 200);

    // Buttons
    const rematchBtn = document.getElementById('btn-rematch');
    if (rematchBtn) rematchBtn.style.display = (isAdmin && !data.tournament) ? '' : 'none';
    const shareBtn = document.getElementById('btn-share-x');
    if (shareBtn) shareBtn.style.display = '';
  }

  function dismissGameOver() {
    document.getElementById('game-over-overlay').style.display = 'none';
    backToRoom();
  }

  function endCurrentGame() {
    if (!isAdmin) return;
    socket.emit('end-game');
  }

  function backToRoom() {
    for (const [id, h] of Object.entries(registeredGames)) {
      if (h._active && h.destroy) { h.destroy(); h._active = false; }
    }
    navigate('room');
    renderRoom();
  }

  // ─── Debate ───
  function showCreateDebate() {
    const playerOptions = currentRoom.players.map(p =>
      `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.9rem;">
        <input type="checkbox" class="debate-participant-check" value="${p.id}" checked> ${escHtml(p.name)}
      </label>`
    ).join('');

    openModal(t('debate_create'), `
      <div class="input-group">
        <label>${t('debate_topic')}</label>
        <input type="text" id="debate-topic-input" placeholder="" maxlength="100">
      </div>
      <div class="input-group">
        <label>${t('debate_participants')}</label>
        <div style="max-height:150px;overflow-y:auto;padding:8px;background:var(--bg-2);border-radius:var(--radius-sm);">
          ${playerOptions}
        </div>
      </div>
      <div class="input-group">
        <label>${t('debate_time_per')}</label>
        <input type="number" id="debate-time-input" value="120" min="30" max="600">
      </div>
      <button onclick="SpaceGames.createDebate()" class="btn btn-accent btn-lg">⏱️ ${t('debate_create')}</button>
    `);
  }

  function createDebate() {
    const topic = document.getElementById('debate-topic-input').value.trim() || 'Open Discussion';
    const timePerPerson = parseInt(document.getElementById('debate-time-input').value) || 120;
    const checks = document.querySelectorAll('.debate-participant-check:checked');
    const participants = Array.from(checks).map(c => c.value);

    if (participants.length < 2) return toast('Need at least 2 participants', 'error');

    socket.emit('create-debate', { topic, participants, timePerPerson });
    closeModal();
    toast(t('debate_created'), 'success');
  }

  function openDebate() {
    if (!currentRoom || !currentRoom.debate) return;
    navigate('debate');
    renderDebate(currentRoom.debate);
  }

  function renderDebate(debate) {
    if (!debate || !currentRoom) return;
    document.getElementById('debate-topic').textContent = '⏱️ ' + debate.topic;

    // Participants
    const participantsHtml = debate.participants.map(pid => {
      const player = currentRoom.players.find(p => p.id === pid);
      const name = player ? player.name : 'Unknown';
      const used = debate.timeUsed[pid] || 0;
      const total = debate.timePerPerson;
      const pct = Math.min((used / total) * 100, 100);
      const isSpeaking = debate.currentSpeaker === pid && debate.isRunning && !debate.isPaused;
      const remaining = total - used;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const timerClass = pct > 80 ? 'danger' : pct > 60 ? 'warning' : '';
      const barColor = pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--accent)' : 'var(--success)';

      return `
        <div class="debate-participant-card ${isSpeaking ? 'speaking' : ''}">
          ${isSpeaking ? '<span class="dp-speaking-label">SPEAKING</span>' : ''}
          <div class="dp-name">${escHtml(name)}</div>
          <div class="dp-timer ${timerClass}">${mins}:${String(secs).padStart(2, '0')}</div>
          <div style="font-size:0.8rem;color:var(--text-dim);">${formatTime(used)} used / ${formatTime(total)} total</div>
          <div class="dp-progress">
            <div class="dp-progress-bar" style="width:${pct}%;background:${barColor}"></div>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('debate-participants').innerHTML = participantsHtml;

    // Dashboard chart
    const totalUsed = debate.participants.reduce((s, pid) => s + (debate.timeUsed[pid] || 0), 0) || 1;
    const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--success)', 'var(--danger)', '#e879f9', '#fb923c', '#a78bfa'];
    const chartHtml = debate.participants.map((pid, i) => {
      const player = currentRoom.players.find(p => p.id === pid);
      const name = player ? player.name : 'Unknown';
      const used = debate.timeUsed[pid] || 0;
      const pct = ((used / totalUsed) * 100).toFixed(1);
      return `
        <div class="debate-chart-bar">
          <div class="dcb-name">${escHtml(name)}</div>
          <div class="dcb-bar-container">
            <div class="dcb-bar" style="width:${pct}%;background:${colors[i % colors.length]};">${formatTime(used)}</div>
          </div>
          <div class="dcb-percent">${pct}%</div>
        </div>
      `;
    }).join('');
    document.getElementById('debate-dashboard').innerHTML = `<h3 style="margin-bottom:16px;font-size:1rem;">Speaking Distribution</h3>` + chartHtml;

    // Admin controls
    const adminPanel = document.getElementById('debate-admin-controls');
    if (isAdmin) {
      adminPanel.style.display = '';
      const buttonsHtml = debate.participants.map(pid => {
        const player = currentRoom.players.find(p => p.id === pid);
        const name = player ? player.name : 'Unknown';
        const isCurrent = debate.currentSpeaker === pid;
        return `<button class="debate-admin-btn ${isCurrent ? 'active-speaker' : ''}" onclick="SpaceGames.debateAction('set-speaker', '${pid}')">
          ${isCurrent ? '🎙️' : '👤'} ${escHtml(name)}
        </button>`;
      }).join('');

      document.getElementById('debate-admin-panel').innerHTML = `
        <p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:10px;">Click a participant to give them the floor:</p>
        ${buttonsHtml}
        <hr style="border-color:var(--border);margin:12px 0;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${debate.isRunning && !debate.isPaused ?
            '<button class="btn btn-sm btn-secondary" onclick="SpaceGames.debateAction(\'pause\')">⏸ Pause</button>' :
            debate.isPaused ?
            '<button class="btn btn-sm btn-success" onclick="SpaceGames.debateAction(\'resume\')">▶ Resume</button>' : ''}
          <button class="btn btn-sm btn-secondary" onclick="SpaceGames.debateAction('stop')">⏹ Stop</button>
          <button class="btn btn-sm btn-secondary" onclick="SpaceGames.debateAction('reset')">🔄 Reset</button>
          <button class="btn btn-sm btn-danger" onclick="SpaceGames.debateAction('end')">End Debate</button>
        </div>
      `;
    } else {
      adminPanel.style.display = 'none';
    }

    // Stats
    const stats = debate.participants.map(pid => {
      const player = currentRoom.players.find(p => p.id === pid);
      const name = player ? player.name : 'Unknown';
      const used = debate.timeUsed[pid] || 0;
      const total = debate.timePerPerson;
      return { name, used, remaining: total - used, pct: ((used / total) * 100).toFixed(0) };
    }).sort((a, b) => b.used - a.used);

    document.getElementById('debate-stats').innerHTML = stats.map(s => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
        <span>${escHtml(s.name)}</span>
        <span style="color:var(--text-muted);">${formatTime(s.used)} (${s.pct}%)</span>
      </div>
    `).join('');
  }

  function debateAction(action, participantId) {
    socket.emit('debate-action', { action, data: { participantId } });
  }

  // ─── Avatar Picker ───
  function showAvatarPicker() {
    const avatars = ['😎','🤠','👾','🦊','🐱','🦁','🐺','🦅','🐉','🎃','👻','🤖','🧙','🥷','🏴‍☠️','🦄','🐧','🦋','🔥','⚡','🌟','💎','🎭','🃏'];
    const grid = avatars.map(a => `<div class="avatar-option ${a === playerAvatar ? 'selected' : ''}" onclick="SpaceGames.pickAvatar('${a}')">${a}</div>`).join('');
    openModal(t('profile_avatar'), `<div class="avatar-grid">${grid}</div>`);
  }

  function pickAvatar(avatar) {
    playerAvatar = avatar;
    localStorage.setItem('sg_avatar', avatar);
    document.getElementById('nav-avatar').textContent = avatar;
    socket.emit('update-profile', { avatar });
    closeModal();
    playSound('move');
  }

  // ─── Quick Play (one-tap) ───
  function showQuickPlay() {
    const gi = getGameInfo();
    const gamesHtml = Object.entries(gi).map(([id, g]) =>
      `<button class="quick-game-btn" onclick="SpaceGames.quickPlayPick('${id}')">
        <span class="qg-icon">${g.icon}</span>
        <span class="qg-name">${g.name}</span>
      </button>`
    ).join('');
    openModal(t('quick_play'), `
      <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px;">${t('quick_play_desc')}</p>
      <div class="input-group" style="margin-bottom:12px;">
        <label>${t('modal_name')}</label>
        <input type="text" id="qp-name" value="${playerName}" placeholder="${t('modal_enter_name')}" maxlength="20">
      </div>
      <div class="quick-games-grid">${gamesHtml}</div>
    `);
  }

  let _qpGameType = null;
  function quickPlayPick(gameType) {
    _qpGameType = gameType;
    const name = document.getElementById('qp-name')?.value?.trim();
    if (!name) return toast(t('modal_name_req'), 'error');
    // Show difficulty picker
    document.getElementById('modal-body').innerHTML = `
      <p style="text-align:center;font-size:1rem;margin-bottom:16px;">${getGameInfo()[gameType].icon} ${getGameInfo()[gameType].name}</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="SpaceGames.quickPlayStart('easy')" class="btn btn-success btn-lg" style="justify-content:center;">🟢 ${t('bot_easy')}</button>
        <button onclick="SpaceGames.quickPlayStart('medium')" class="btn btn-secondary btn-lg" style="justify-content:center;border:2px solid var(--accent);">🟡 ${t('bot_medium')}</button>
        <button onclick="SpaceGames.quickPlayStart('hard')" class="btn btn-danger btn-lg" style="justify-content:center;">🔴 ${t('bot_hard')}</button>
      </div>
    `;
  }

  function quickPlayStart(difficulty) {
    const nameEl = document.getElementById('qp-name');
    const name = nameEl ? nameEl.value.trim() : playerName;
    if (!name) return toast(t('modal_name_req'), 'error');
    playerName = name;
    localStorage.setItem('sg_playerName', name);
    closeModal();

    // 1. Create room
    socket.emit('create-room', { playerName: name }, (res) => {
      if (res.error) return toast(res.error, 'error');
      playerId = res.playerId;
      currentRoom = res.room;
      isAdmin = true;
      if (res.profile) { playerProfile = res.profile; playerAvatar = res.profile.avatar; playerLevel = res.profile.level; }

      // 2. Add bot, wait for confirmation, then start game
      socket.emit('add-bot', { difficulty });
      socket.once('room-update', () => {
        socket.emit('start-game', { gameType: _qpGameType });
      });

      enterRoom();
      playSound('join');
    });
  }

  // ─── Bots ───
  function addBot(difficulty) { if (!isAdmin) return; socket.emit('add-bot', { difficulty }); }
  function removeBot(botId) { if (!isAdmin) return; socket.emit('remove-bot', { botId }); }
  function removeAllBots() { if (!isAdmin) return; socket.emit('remove-all-bots'); }

  // ─── Player Profile Card ───
  function showPlayerProfile(name) {
    socket.emit('get-profile', { name }, (data) => {
      if (!data) return;
      const gi = getGameInfo();
      const lvl = data.level || 1;
      const xpNeeded = lvl * lvl * 100;
      const xpPrev = (lvl - 1) * (lvl - 1) * 100;
      const xpPct = xpNeeded > xpPrev ? Math.min(((data.xp - xpPrev) / (xpNeeded - xpPrev)) * 100, 100) : 0;
      const achHtml = (data.achievements || []).map(id => `<span class="profile-ach" title="${getAchName(id)}">${getAchIcon(id)}</span>`).join('') || `<span style="color:var(--text-dim)">${t('profile_none_yet')}</span>`;
      const favGame = data.favoriteGame && gi[data.favoriteGame] ? gi[data.favoriteGame].icon + ' ' + gi[data.favoriteGame].name : '-';
      openModal(data.name, `<div class="profile-card">
        <div class="profile-header"><span class="profile-avatar">${data.avatar || '😎'}</span><div><div class="profile-name">${escHtml(data.name)}</div>${data.selectedTitle ? '<div class="profile-title">' + getTitleDisplay(data.selectedTitle) + '</div>' : ''}</div></div>
        <div class="profile-level"><span>${t('lvl')}${lvl}</span><div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div><span class="xp-text">${data.xp} XP</span></div>
        <div class="profile-stats-grid">
          <div class="profile-stat"><div class="ps-value">${data.gamesPlayed}</div><div class="ps-label">${t('lb_played')}</div></div>
          <div class="profile-stat"><div class="ps-value">${data.winRate || 0}%</div><div class="ps-label">${t('profile_winrate')}</div></div>
          <div class="profile-stat"><div class="ps-value">${data.streak || 0}</div><div class="ps-label">Streak</div></div>
          <div class="profile-stat"><div class="ps-value">${data.totalPoints}</div><div class="ps-label">${t('lb_points')}</div></div>
        </div>
        <div class="profile-row"><span class="pr-label">${t('profile_favgame')}</span><span>${favGame}</span></div>
        <div class="profile-row"><span class="pr-label">${t('profile_maxstreak')}</span><span>${data.maxStreak || 0}</span></div>
        <div class="profile-section-title">${t('profile_achievements')}</div>
        <div class="profile-achievements">${achHtml}</div>
      </div>`);
    });
  }

  // ─── Game Settings Modal ───
  function showGameSettings(gameType, info) {
    const isTimed = ['trivia','wordscramble','emojiguess','hangman','fastmath'].includes(gameType);
    const hasRounds = ['rps','trivia','wordscramble','emojiguess','hangman','fastmath'].includes(gameType);
    const isTwoPlayer = info.max === 2;
    let html = `<div class="game-settings"><div class="gs-game-header">${info.icon} ${info.name}</div>`;
    if (isTwoPlayer && currentRoom.players.length > 2) {
      html += `<div class="input-group"><label>${t('gs_select_players')}</label><div class="gs-player-select">`;
      currentRoom.players.forEach(p => { html += `<label class="gs-player-check"><input type="checkbox" class="gs-pcb" value="${p.id}" ${p.id===playerId?'checked':''}> ${p.avatar||'😎'} ${escHtml(p.name)}</label>`; });
      html += `</div></div>`;
    }
    if (isTimed) {
      const def = {trivia:15,wordscramble:30,emojiguess:30,hangman:45,fastmath:20}[gameType] || 15;
      html += `<div class="input-group"><label>${t('gs_timer')} (${t('gs_seconds')})</label><input type="range" id="gs-timer" min="5" max="60" value="${def}" oninput="document.getElementById('gs-tv').textContent=this.value"><span id="gs-tv" class="gs-range-val">${def}</span></div>`;
    }
    if (hasRounds) {
      const def = {rps:5,trivia:10,wordscramble:8,emojiguess:8,hangman:8,fastmath:10}[gameType] || 5;
      html += `<div class="input-group"><label>${t('gs_rounds')}</label><input type="range" id="gs-rounds" min="1" max="${def}" value="${def}" oninput="document.getElementById('gs-rv').textContent=this.value"><span id="gs-rv" class="gs-range-val">${def}</span></div>`;
    }
    html += `<button onclick="SpaceGames.confirmStartGame('${gameType}')" class="btn btn-accent btn-lg" style="width:100%;justify-content:center;margin-top:8px;">${t('btn_start_game')}</button></div>`;
    openModal(t('gs_settings'), html);
  }

  function confirmStartGame(gameType) {
    const options = {};
    const te = document.getElementById('gs-timer');
    if (te) options.timer = parseInt(te.value);
    const re = document.getElementById('gs-rounds');
    if (re) options.rounds = parseInt(re.value);
    const checks = document.querySelectorAll('.gs-pcb:checked');
    if (checks.length === 2) options.players = Array.from(checks).map(c => c.value);
    else if (checks.length > 0 && checks.length !== 2) return toast(t('gs_select_2'), 'error');
    socket.emit('start-game', { gameType, options });
    closeModal();
  }

  // ─── Share to X ───
  let _lastGameResult = null;
  function shareToX() {
    if (!_lastGameResult) return;
    const d = _lastGameResult;
    const gi = getGameInfo();
    const gn = gi[d.gameType]?.name || d.gameType;
    let txt;
    if (d.winner === playerId) {
      const sc = d.scores ? d.scores[playerId] : null;
      txt = lang === 'ar'
        ? `🏆 فزت في ${gn}${sc !== null ? ' بنتيجة ' + sc : ''}! العب معي على SpaceGames 🎮`
        : `🏆 I won ${gn}${sc !== null ? ' with ' + sc + ' pts' : ''}! Play with me on SpaceGames 🎮`;
    } else if (d.draw) {
      txt = lang === 'ar' ? `🤝 تعادلت في ${gn}! جرب تهزمني 🎮` : `🤝 I tied in ${gn}! Try to beat me 🎮`;
    } else {
      txt = lang === 'ar' ? `🎮 لعبت ${gn} على SpaceGames! انضم وتحداني` : `🎮 Just played ${gn} on SpaceGames! Join and challenge me`;
    }
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt + '\n' + location.origin)}`;
    window.open(url, '_blank', 'width=550,height=420');
  }

  // ─── Daily Challenge ───
  function renderDailyChallenge() {
    const el = document.getElementById('daily-challenge-card');
    if (!el) return;
    fetch('/api/daily-challenge').then(r => r.json()).then(dc => {
      if (!playerProfile || !playerProfile.dailyChallenge) { el.style.display = 'none'; return; }
      el.style.display = '';
      const pdc = playerProfile.dailyChallenge;
      const progress = Math.min(pdc.progress || 0, dc.target);
      const pct = (progress / dc.target) * 100;
      const desc = lang === 'ar' ? dc.ar : dc.en;
      el.className = 'daily-challenge-card' + (pdc.completed ? ' completed' : '');
      el.innerHTML = `
        <div class="dc-title">⭐ ${t('daily_title')}</div>
        <div class="dc-desc">${desc}</div>
        <div class="dc-bar"><div class="dc-fill" style="width:${pct}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;">
          <span>${progress} / ${dc.target}</span>
          <span class="dc-reward">${t('daily_reward')}: +${dc.reward} XP</span>
        </div>
        ${pdc.completed ? '<div style="margin-top:8px;color:var(--success);font-weight:700;">✅ ' + t('daily_complete') + '</div>' : ''}
      `;
    }).catch(() => { el.style.display = 'none'; });
  }

  // ─── Title Selector (extends avatar picker) ───
  function showTitlePicker() {
    if (!playerProfile || !playerProfile.achievements) return;
    const earned = playerProfile.achievements;
    const items = earned.map(id => {
      const a = ACHS_CLIENT.find(x => x.id === id);
      if (!a) return '';
      const sel = playerProfile.selectedTitle === id ? ' selected' : '';
      return `<div class="title-option${sel}" onclick="SpaceGames.selectTitle('${id}')">${a.icon} ${lang === 'ar' ? a.ar : a.en}</div>`;
    }).join('');
    const noneSelected = !playerProfile.selectedTitle ? ' selected' : '';
    openModal(t('title_select'), `<div class="title-grid"><div class="title-option${noneSelected}" onclick="SpaceGames.selectTitle(null)">❌ ${t('title_none')}</div>${items}</div>`);
  }

  function selectTitle(titleId) {
    socket.emit('select-title', { titleId }, (res) => {
      if (res && res.success) { if (playerProfile) playerProfile.selectedTitle = titleId; closeModal(); }
    });
  }

  // ─── Kick Player ───
  function kickPlayer(targetId) {
    if (!isAdmin) return;
    socket.emit('kick-player', { targetId });
    toast(t('player_kicked'), 'info');
  }

  // ─── Rematch ───
  function requestRematch() {
    if (!isAdmin || !lastGameType) return;
    socket.emit('start-game', { gameType: lastGameType });
    document.getElementById('game-over-overlay').style.display = 'none';
  }

  // ─── Voting ───
  function createVote() {
    if (!isAdmin) return;
    socket.emit('create-vote');
    toast(t('vote_started'), 'success');
  }

  function castVote(option) {
    socket.emit('cast-vote', { option });
    playSound('move');
  }

  function renderVote(data) {
    const el = document.getElementById('vote-display');
    if (!el || !data) { if (el) el.innerHTML = ''; return; }
    const gi = getGameInfo();
    const total = Object.values(data.votes).reduce((s, v) => s + v, 0) || 1;
    const optionsHtml = data.options.map(opt => {
      const info = gi[opt];
      if (!info) return '';
      const count = data.votes[opt] || 0;
      const pct = ((count / total) * 100).toFixed(0);
      return `<div class="vote-option" onclick="SpaceGames.castVote('${opt}')">
        <span style="font-size:1.2rem">${info.icon}</span>
        <span style="flex:0 0 100px;font-size:0.8rem;font-weight:600">${info.name}</span>
        <div class="vote-bar-container"><div class="vote-bar" style="width:${pct}%"></div><span class="vote-bar-label">${count}</span></div>
      </div>`;
    }).join('');
    el.innerHTML = `<div class="vote-card"><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">${t('vote_next')}</div>${optionsHtml}</div>`;
  }

  // ─── Tournament ───
  function showTournamentSetup() {
    if (!isAdmin) return;
    const gi = getGameInfo();
    const gameOptions = Object.entries(gi).filter(([, g]) => g.min === 2 && g.max === 2).map(([id, g]) =>
      `<option value="${id}">${g.icon} ${g.name}</option>`
    ).join('');
    openModal(t('tourn_title'), `
      <div class="input-group"><label>${t('tourn_game')}</label><select id="tournament-game">${gameOptions}</select></div>
      <p style="font-size:0.8rem;color:var(--text-muted)">${t('tourn_desc')}</p>
      <button onclick="SpaceGames.startTournament()" class="btn btn-accent btn-lg">${t('tourn_start')}</button>
    `);
  }

  function startTournament() {
    const gameType = document.getElementById('tournament-game').value;
    socket.emit('start-tournament', { gameType });
    closeModal();
  }

  function renderTournamentBracket(t, containerId) {
    const el = document.getElementById(containerId);
    if (!el || !t) { if (el) el.innerHTML = ''; return; }
    const names = t.playerNames || {};
    let html = '<div class="bracket-container"><div class="bracket">';
    const roundNames = ['Round 1', 'Quarter', 'Semi', 'Final'];
    t.bracket.forEach((round, ri) => {
      html += `<div class="bracket-round"><div class="bracket-round-title">${roundNames[ri] || 'Round ' + (ri + 1)}</div>`;
      round.forEach((match, mi) => {
        const playable = !match.played && match.p1 && match.p2 && ri === t.currentRound && isAdmin;
        html += `<div class="bracket-match ${playable ? 'playable' : ''}" ${playable ? `onclick="SpaceGames.playTournamentMatch(${mi})"` : ''}>`;
        html += `<div class="bracket-player ${match.winner === match.p1 ? 'winner' : ''} ${!match.p1 ? 'bye' : ''}">${match.p1 ? escHtml(names[match.p1] || '?') : 'BYE'}</div>`;
        html += `<div class="bracket-player ${match.winner === match.p2 ? 'winner' : ''} ${!match.p2 ? 'bye' : ''}">${match.p2 ? escHtml(names[match.p2] || '?') : 'BYE'}</div>`;
        html += '</div>';
      });
      html += '</div>';
    });
    if (t.champion) {
      html += `<div class="bracket-round"><div class="bracket-round-title">Champion</div><div class="bracket-champion">👑 ${escHtml(names[t.champion] || '?')}</div></div>`;
    }
    html += '</div></div>';
    el.innerHTML = html;
  }

  function playTournamentMatch(matchIndex) {
    if (!isAdmin) return;
    socket.emit('tournament-match', { matchIndex });
  }

  // ─── Achievement Display ───
  function showAchievement(ach) {
    playSound('achievement');
    const container = document.getElementById('achievement-container');
    const el = document.createElement('div');
    el.className = 'achievement-toast';
    el.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-label">${t('ach_unlocked')}</div><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ─── Leaderboard ───
  function loadLeaderboard(filter) {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });

    const url = filter === 'all' ? '/api/leaderboard' : '/api/leaderboard/' + filter;
    fetch(url)
      .then(r => r.json())
      .then(data => renderLeaderboard(data, filter))
      .catch(() => {
        document.getElementById('leaderboard-content').innerHTML = '<div class="empty-state">Failed to load leaderboard</div>';
      });
  }

  function renderLeaderboard(data, filter) {
    const el = document.getElementById('leaderboard-content');
    if (!data.length) {
      el.innerHTML = '<div class="empty-state">No scores yet. Play some games to get on the board!</div>';
      return;
    }

    const isGameFilter = filter !== 'all';
    const headers = isGameFilter
      ? '<th>Rank</th><th>Player</th><th>Played</th><th>Wins</th><th>Points</th>'
      : '<th>Rank</th><th>Player</th><th>Played</th><th>W / L / D</th><th>Points</th>';

    const rows = data.map((p, i) => {
      const rank = i + 1;
      const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;

      if (isGameFilter) {
        return `<tr>
          <td class="lb-rank ${rankClass}">${medal}</td>
          <td class="lb-name">${escHtml(p.name)}</td>
          <td>${p.played}</td>
          <td>${p.wins}</td>
          <td class="lb-points">${p.points}</td>
        </tr>`;
      }
      return `<tr>
        <td class="lb-rank ${rankClass}">${medal}</td>
        <td class="lb-name"><span style="margin-right:6px">${p.avatar || '😎'}</span>${escHtml(p.name)} <span class="level-badge${(p.level || 1) >= 10 ? ' elite' : (p.level || 1) >= 5 ? ' high' : ''}">Lv.${p.level || 1}</span>${(p.streak || 0) >= 3 ? ' <span class="streak-badge">🔥' + p.streak + '</span>' : ''}</td>
        <td>${p.gamesPlayed}</td>
        <td>${p.wins} / ${p.losses} / ${p.draws}</td>
        <td class="lb-points">${p.totalPoints}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `<table class="lb-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  // ─── Socket Listeners ───
  function setupSocketListeners() {
    socket.on('room-update', (room) => {
      currentRoom = room;
      isAdmin = room.admin === playerId;
      renderRoom();
    });

    socket.on('player-joined', (data) => {
      addSystemMessage(t('joined_room', { name: data.name }));
      toast(t('joined_room', { name: data.name }), 'info');
      playSound('join');
    });

    socket.on('player-left', (data) => {
      addSystemMessage(t('left_room'));
    });

    socket.on('new-admin', (data) => {
      isAdmin = data.adminId === playerId;
      if (isAdmin) toast(t('now_admin'), 'info');
      renderRoom();
    });

    socket.on('chat-message', addChatMessage);
    socket.on('reaction', showReaction);

    socket.on('game-started', (data) => {
      if (currentRoom) currentRoom.currentGame = data.gameType;
      lastGameType = data.gameType;
      onGameStarted(data);
      playSound('join');
    });

    socket.on('game-update', onGameUpdate);

    socket.on('game-timer', (data) => {
      const el = document.getElementById('game-timer-value');
      const display = document.getElementById('game-timer-display');
      if (el) el.textContent = data.remaining;
      if (display) {
        display.classList.remove('warning', 'danger');
        if (data.remaining <= 3) { display.classList.add('danger'); playSound('tick'); }
        else if (data.remaining <= 5) display.classList.add('warning');
      }
    });

    socket.on('game-over', (data) => {
      if (currentRoom) currentRoom.currentGame = null;
      onGameOver(data);
    });

    socket.on('game-ended', () => {
      if (currentRoom) currentRoom.currentGame = null;
      for (const [id, h] of Object.entries(registeredGames)) {
        if (h._active) { h._active = false; if (h.destroy) h.destroy(); }
      }
      navigate('room');
      renderRoom();
    });

    socket.on('debate-update', (debate) => {
      if (currentRoom) currentRoom.debate = debate;
      if (document.getElementById('page-debate').classList.contains('active')) {
        renderDebate(debate);
      }
      if (document.getElementById('page-room').classList.contains('active')) {
        renderRoom();
      }
      if (!debate) {
        navigate('room');
        renderRoom();
      }
    });

    socket.on('debate-tick', (data) => {
      if (currentRoom && currentRoom.debate) {
        currentRoom.debate.timeUsed = data.timeUsed;
        if (document.getElementById('page-debate').classList.contains('active')) {
          renderDebate(currentRoom.debate);
        }
      }
    });

    socket.on('debate-time-up', (data) => {
      toast("Time's up!", 'info');
    });

    socket.on('achievement-unlocked', (ach) => {
      if (ach) showAchievement(ach);
    });

    socket.on('vote-update', (data) => {
      renderVote(data);
    });

    socket.on('vote-result', (data) => {
      const el = document.getElementById('vote-display');
      if (el && data.results) {
        const sorted = Object.entries(data.results).sort((a, b) => b[1] - a[1]);
        const winner = sorted[0];
        const info = gameInfo[winner[0]];
        el.innerHTML = `<div class="vote-card" style="text-align:center"><p style="font-size:1rem;font-weight:700;margin-bottom:8px">Vote Result: ${info ? info.icon + ' ' + info.name : winner[0]}</p><p style="font-size:0.8rem;color:var(--text-muted)">${winner[1]} votes</p></div>`;
        setTimeout(() => { if (el) el.innerHTML = ''; }, 5000);
      }
    });

    socket.on('tournament-update', (tournData) => {
      if (currentRoom) currentRoom.tournament = tournData;
      renderTournamentBracket(tournData, 'tournament-display');
      if (tournData.champion) {
        const champName = tournData.playerNames[tournData.champion] || '?';
        toast(t('tourn_wins', { name: champName }), 'success');
        if (tournData.champion === playerId) fireConfetti();
      }
    });

    socket.on('player-kicked', (data) => {
      toast(t('kicked'), 'error');
      currentRoom = null;
      isAdmin = false;
      playerId = null;
      document.getElementById('nav-user').style.display = 'none';
      location.hash = '';
      navigate('home');
    });

    socket.on('daily-challenge-complete', (data) => {
      toast(t('daily_complete') + ' +' + data.reward + ' XP', 'success');
      playSound('achievement');
      if (playerProfile && playerProfile.dailyChallenge) playerProfile.dailyChallenge.completed = true;
      renderDailyChallenge();
    });

    socket.on('error-msg', (data) => {
      toast(data.message, 'error');
    });
  }

  // ─── Render Home Games Grid ───
  function renderHomeGames() {
    const grid = document.getElementById('home-games-grid');
    if (!grid) return;
    const gi = getGameInfo();
    grid.innerHTML = Object.entries(gi).map(([id, g]) => `
      <div class="game-card">
        <div class="game-icon">${g.icon}</div>
        <h4>${g.name}</h4>
        <p>${g.desc}</p>
        <div class="player-req">${g.min === g.max ? g.min : g.min + '-' + g.max} ${t('players_label')} | ${g.category}</div>
      </div>
    `).join('');
  }

  // ─── Modal ───
  function openModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').classList.add('active');
  }

  function closeModal(event) {
    if (event && event.target !== document.getElementById('modal-overlay')) return;
    document.getElementById('modal-overlay').classList.remove('active');
  }

  // ─── Toast ───
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // ─── Helpers ───
  function escHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ─── Init on DOM Ready ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ───
  return {
    navigate, showCreateRoom, showJoinRoom, createRoom, joinRoom, leaveRoom,
    copyRoomCode, sendChat, sendReaction, registerGame, startGame,
    endCurrentGame, backToRoom, dismissGameOver,
    showCreateDebate, createDebate, openDebate, debateAction,
    loadLeaderboard, closeModal, toast,
    toggleSound, toggleLang, t, showAvatarPicker, pickAvatar, kickPlayer,
    addBot, removeBot, removeAllBots,
    showQuickPlay, quickPlayPick, quickPlayStart,
    showThemePicker, setTheme, showPlayerProfile, showTitlePicker, selectTitle,
    shareToX, confirmStartGame, dismissWelcome,
    requestRematch, createVote, castVote,
    showTournamentSetup, startTournament, playTournamentMatch,
    get playerId() { return playerId; },
    get playerName() { return playerName; },
    get currentRoom() { return currentRoom; },
    get isAdmin() { return isAdmin; },
    get socket() { return socket; },
    get gameInfo() { return gameInfo; }
  };
})();
