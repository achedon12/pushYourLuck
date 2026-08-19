'use client';

import { useCallback, useRef } from 'react';

/**
 * Retours sonores synthétisés à la volée (WebAudio) plutôt que des fichiers.
 *
 * Zéro octet à télécharger, zéro asset à produire — et surtout la hauteur du
 * son de tirage peut monter avec le nombre de cartes de la manche, ce qu'un
 * échantillon figé ne permet pas. C'est ce glissando qui crée la tension : le
 * joueur ENTEND qu'il est allé loin.
 */
export type SoundName = 'draw' | 'gain' | 'boost' | 'bomb' | 'bank' | 'shop' | 'over';

export function useSound(enabled: boolean) {
    const ctxRef = useRef<AudioContext | null>(null);

    const ctx = useCallback(() => {
        if (!enabled) return null;
        // L'AudioContext ne peut naître que d'un geste utilisateur : on le crée
        // au premier son joué, jamais au montage.
        if (!ctxRef.current) {
            const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!Ctor) return null;
            ctxRef.current = new Ctor();
        }
        if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
        return ctxRef.current;
    }, [enabled]);

    const tone = useCallback(
        (freq: number, duration: number, type: OscillatorType, gain: number, slideTo?: number) => {
            const audio = ctx();
            if (!audio) return;
            const osc = audio.createOscillator();
            const vol = audio.createGain();
            const t = audio.currentTime;

            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);

            vol.gain.setValueAtTime(0.0001, t);
            vol.gain.exponentialRampToValueAtTime(gain, t + 0.012);
            vol.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            osc.connect(vol).connect(audio.destination);
            osc.start(t);
            osc.stop(t + duration + 0.02);
        },
        [ctx],
    );

    const noise = useCallback((duration: number, gain: number) => {
        const audio = ctx();
        if (!audio) return;
        const frames = Math.floor(audio.sampleRate * duration);
        const buffer = audio.createBuffer(1, frames, audio.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;

        const src = audio.createBufferSource();
        const vol = audio.createGain();
        const filter = audio.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, audio.currentTime);
        vol.gain.setValueAtTime(gain, audio.currentTime);
        src.buffer = buffer;
        src.connect(filter).connect(vol).connect(audio.destination);
        src.start();
    }, [ctx]);

    /** `step` = nombre de cartes déjà tirées, pilote la montée du glissando. */
    return useCallback(
        (name: SoundName, step = 0) => {
            switch (name) {
                case 'draw':
                    // Demi-ton par carte : au bout de six tirages on est une quinte
                    // au-dessus, et l'oreille sait qu'il est temps d'encaisser.
                    tone(220 * Math.pow(2, step / 12), 0.09, 'triangle', 0.07);
                    break;
                case 'gain':
                    tone(520 * Math.pow(2, step / 12), 0.12, 'sine', 0.08, 780 * Math.pow(2, step / 12));
                    break;
                case 'boost':
                    tone(660, 0.22, 'square', 0.05, 1320);
                    break;
                case 'bomb':
                    noise(0.5, 0.32);
                    tone(160, 0.42, 'sawtooth', 0.16, 42);
                    break;
                case 'bank':
                    [523, 659, 784, 1047].forEach((f, i) =>
                        setTimeout(() => tone(f, 0.16, 'sine', 0.07), i * 55),
                    );
                    break;
                case 'shop':
                    tone(880, 0.1, 'sine', 0.05, 1180);
                    break;
                case 'over':
                    [392, 349, 294, 233].forEach((f, i) =>
                        setTimeout(() => tone(f, 0.3, 'triangle', 0.07), i * 130),
                    );
                    break;
            }
        },
        [tone, noise],
    );
}
