// OneYT — dashboard section: Playback.
// Speed, volume, quality, autoplay, captions.
(function () {
  'use strict';

  var section = {
    id: 'playback',
    title: 'Playback',
    description: 'Speed, volume, quality, autoplay and captions.',
    controls: [
      {
        key: 'playback.defaultSpeed',
        type: 'select',
        label: 'Default speed',
        description: 'Speed every video starts at (unless a remembered speed exists).',
        source: 'speedPresets',
        keywords: ['speed', 'playback', 'rate'],
      },
      {
        key: 'playback.rememberSpeed',
        type: 'toggle',
        label: 'Remember speed',
        description: 'Remember the speed you set by hand and use it for the next video.',
        keywords: ['speed', 'remember'],
      },
      {
        key: 'playback.speedPresets',
        type: 'speedList',
        label: 'Speed presets',
        description: 'Speeds offered by the Shift+> / Shift+< shortcuts. 0.25x–4x.',
        keywords: ['speed', 'presets', 'list'],
      },
      {
        key: 'playback.defaultVolume',
        type: 'range',
        label: 'Default volume',
        description: 'Volume every video starts at (unless a remembered volume exists).',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        keywords: ['volume', 'playback', 'loudness'],
      },
      {
        key: 'playback.rememberVolume',
        type: 'toggle',
        label: 'Remember volume',
        description: 'Remember the volume you set by hand and use it for the next video.',
        keywords: ['volume', 'remember'],
      },
      {
        key: 'playback.autoplay',
        type: 'select',
        label: 'Autoplay next video',
        description: 'YouTube’s autoplay toggle. Default = leave YouTube alone.',
        source: 'triState',
        keywords: ['autoplay', 'next', 'automatic'],
      },
      {
        key: 'playback.defaultQuality',
        type: 'select',
        label: 'Preferred quality',
        description: 'Best-effort: used only when the level is available for that video.',
        source: 'qualities',
        keywords: ['quality', 'resolution', '1080p', '720p', 'hd'],
      },
      {
        key: 'playback.captions',
        type: 'select',
        label: 'Captions',
        description: 'Turn captions on or off. Default = leave YouTube alone.',
        source: 'triState',
        keywords: ['captions', 'subtitles', 'cc'],
      },
      {
        key: 'playback.captionFontSize',
        type: 'number',
        label: 'Caption font size',
        description: 'Caption text size in percent. 0 = YouTube default.',
        min: 0,
        max: 200,
        step: 5,
        unit: '%',
        keywords: ['captions', 'font', 'size', 'subtitles'],
      },
    ],
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.optionsSections = ns.optionsSections || {};
  ns.optionsSections.playback = section;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = section;
  }
})();
