const castleImg = document.getElementById('castle');
const tracks = document.querySelectorAll('.track');
const channelButtons = document.querySelectorAll('[data-track-index]');
const nowPlaying = document.getElementById('now-playing');
const trackTime = document.getElementById('track-time');
const applePlayer = document.getElementById('apple-player');
const appleFrame = document.querySelector('.apple-frame');
const companion = document.querySelector('.companion');
const companionButton = document.querySelector('.companion-button');
const muteIndicator = document.querySelector('.mute-indicator');
const companionDialog = document.querySelector('.companion-dialog');
const dialogText = document.querySelector('.dialog-text');
const backgroundField = document.querySelector('.background-field');
const scrollMeter = document.querySelector('.scroll-meter span');
const headerDate = document.getElementById('header-date');
const messages = [
    'A wild song appeared.',
    'The archive is watching.',
    'You found a secret room.',
    'DOG.EXE is feeling nostalgic.',
    'The night drive continues...'
];
let audioContext;
let scrollOffset = 0;
let scrollVelocity = 0;
let previousScroll = window.scrollY;
let dialogTimer;
let typingId = 0;
let companionMuted = false;
const activeBlips = new Set();

function updateLocalDateTime() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat(navigator.language || 'en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
    }).formatToParts(now).reduce(function(values, part) {
        values[part.type] = part.value;
        return values;
    }, {});
    headerDate.textContent = `${parts.weekday} ${parts.day} ${parts.month} ${parts.year} // ${parts.hour}:${parts.minute}:${parts.second} ${parts.timeZoneName}`.toUpperCase();
}

updateLocalDateTime();
setInterval(updateLocalDateTime, 1000);

castleImg.addEventListener('click', function() {
    castleImg.classList.add('glitch');
    setTimeout(function() {
        castleImg.classList.remove('glitch');
    }, 150);
});

tracks.forEach(function(track) {
    track.addEventListener('click', function() {
        tracks.forEach(function(item) {
            item.classList.remove('is-playing');
            item.querySelector('i').textContent = 'PLAY';
        });
        track.classList.add('is-playing');
        track.querySelector('i').textContent = 'PAUSE';
        nowPlaying.textContent = track.dataset.track;
        trackTime.textContent = '00:00 / ' + track.dataset.duration;
        if (track.dataset.url) {
            const appleEmbedUrl = track.dataset.url.replace('://music.apple.com', '://embed.music.apple.com');
            applePlayer.src = appleEmbedUrl;
            appleFrame.classList.add('is-loaded');
        }
    });
});

channelButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        const track = tracks[Number(button.dataset.trackIndex)];
        track.click();
        document.getElementById('music').scrollIntoView({ behavior: 'smooth' });
    });
});

function unlockAudio() {
    if (!audioContext) {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;
        if (!AudioEngine) return;
        try {
            audioContext = new AudioEngine();
        } catch (error) {
            audioContext = null;
            return;
        }
    }
    if (audioContext.state === 'suspended') audioContext.resume();
}

function typeBlip() {
    if (companionMuted || !audioContext || audioContext.state !== 'running') return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 520 + Math.random() * 160;
    gain.gain.setValueAtTime(.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .045);
    oscillator.connect(gain).connect(audioContext.destination);
    activeBlips.add(oscillator);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + .05);
    oscillator.addEventListener('ended', function() {
        activeBlips.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
    }, { once: true });
}

function stopBlips() {
    activeBlips.forEach(function(oscillator) {
        try { oscillator.stop(); } catch (error) {}
        oscillator.disconnect();
    });
    activeBlips.clear();
}

companionButton.addEventListener('click', function() {
    companionMuted = !companionMuted;
    if (companionMuted) stopBlips();
    companionButton.classList.toggle('is-muted', companionMuted);
    companionButton.setAttribute('aria-pressed', companionMuted);
    companionButton.setAttribute('aria-label', companionMuted ? 'Unmute dog companion' : 'Mute dog companion');
    muteIndicator.textContent = companionMuted ? 'MUTE' : '';
    showCompanionMessage(companionMuted ? 'DOG.EXE IS MUTED.' : 'DOG.EXE SOUND ONLINE.');
});

function showCompanionMessage(forcedMessage) {
    const currentTypingId = ++typingId;
    const message = forcedMessage || messages[Math.floor(Math.random() * messages.length)];
    clearTimeout(dialogTimer);
    companionDialog.classList.add('is-visible');
    dialogText.textContent = '';
    let character = 0;
    const typeNext = function() {
        if (currentTypingId !== typingId) return;
        if (character >= message.length) {
            dialogTimer = setTimeout(function() { companionDialog.classList.remove('is-visible'); }, 4200);
            return;
        }
        dialogText.textContent += message[character];
        if (message[character] !== ' ') typeBlip();
        character += 1;
        dialogTimer = setTimeout(typeNext, 42 + Math.random() * 34);
    };
    typeNext();
}

function animateCompanion() {
    scrollOffset += (scrollVelocity - scrollOffset) * .08;
    scrollVelocity *= .88;
    companion.style.setProperty('--scroll-bob', scrollOffset.toFixed(2) + 'px');
    requestAnimationFrame(animateCompanion);
}

window.addEventListener('scroll', function() {
    const currentScroll = window.scrollY;
    scrollVelocity = Math.max(-18, Math.min(18, (currentScroll - previousScroll) * 1.8));
    previousScroll = currentScroll;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    scrollMeter.style.width = (scrollRange ? (currentScroll / scrollRange) * 100 : 0) + '%';
});

window.addEventListener('pointermove', function(event) {
    const x = (event.clientX / window.innerWidth - .5) * 2;
    const y = (event.clientY / window.innerHeight - .5) * 2;
    backgroundField.style.setProperty('--pointer-x', x.toFixed(3));
    backgroundField.style.setProperty('--pointer-y', y.toFixed(3));
});

document.addEventListener('pointerdown', unlockAudio, { once: true });
setTimeout(showCompanionMessage, 6500);
setInterval(showCompanionMessage, 18000 + Math.random() * 8000);
animateCompanion();
