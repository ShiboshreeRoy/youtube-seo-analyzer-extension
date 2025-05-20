// Popup Script
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: extractVideoSEO
  }, (results) => {
    const data = results[0].result;

    if (!data) return alert("Failed to extract SEO data.");

    document.getElementById('videoTitle').textContent = data.title || 'Not found';
    document.getElementById('descLength').textContent = data.description.length || 0;
    document.getElementById('seoScore').textContent = data.seoScore || 0;

    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = '';
    data.tags.forEach(tag => {
      const li = document.createElement('li');
      li.textContent = tag;
      tagsList.appendChild(li);
    });

    function copyAndNotify(content, label) {
      navigator.clipboard.writeText(content).then(() => {
        alert(`${label} copied to clipboard.`);
      }).catch(() => {
        alert(`Failed to copy ${label}.`);
      });
    }

    document.getElementById('copyTitleBtn').onclick = () => copyAndNotify(data.title, "Title");
    document.getElementById('copyDescBtn').onclick = () => copyAndNotify(data.description, "Description");
    document.getElementById('copyTagsBtn').onclick = () => copyAndNotify(data.tags.join(', '), "Tags");
  });
});

// In-Page Content Script: Extract SEO Data from YouTube
function extractVideoSEO() {
  try {
    const title = document.querySelector('h1.title, h1.ytd-watch-metadata')?.innerText.trim() ||
                  document.querySelector('meta[name="title"]')?.content ||
                  document.title;

    const description = document.querySelector('meta[name="description"]')?.content ||
                        document.querySelector('yt-formatted-string.content')?.innerText.trim() ||
                        '';

    let tags = [];

    // Tags from meta keywords
    const keywordsMeta = document.querySelector('meta[name="keywords"]')?.content;
    if (keywordsMeta) tags.push(...keywordsMeta.split(',').map(t => t.trim()));

    // Extract tags from JSON-LD or page scripts
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"], script')).map(s => s.textContent);
    scripts.forEach(script => {
      try {
        const json = JSON.parse(script);
        if (json && json.keywords) {
          const moreTags = Array.isArray(json.keywords) ? json.keywords : json.keywords.split(',');
          tags.push(...moreTags.map(t => t.trim()));
        }
      } catch (e) {}
    });

    tags = Array.from(new Set(tags.filter(Boolean))); // remove empty and duplicates

    // --- SEO Score Calculation ---
    let score = 0;

    const cleanText = text => text.toLowerCase().replace(/[^\w\s]/g, '');
    const hasEmojis = text => /[\u{1F600}-\u{1F6FF}]/u.test(text);

    // Title Score
    if (title.length >= 40 && title.length <= 70) score += 20;
    if (tags.some(tag => cleanText(title).includes(cleanText(tag)))) score += 15;
    if (/[?!]/.test(title)) score += 5;
    if (hasEmojis(title)) score += 5;

    // Description Score
    if (description.length >= 100 && description.length <= 5000) score += 20;
    if (/subscribe|like|comment|link|share|follow/i.test(description)) score += 10;

    // Tags Score
    if (tags.length >= 5) score += 15;
    if (tags.length >= 10) score += 10;
    if (new Set(tags.map(t => t.toLowerCase())).size !== tags.length) score -= 5;

    // Keyword Density Bonus
    const descWords = new Set(cleanText(description).split(/\s+/));
    const keywordHits = tags.filter(tag => descWords.has(cleanText(tag)));
    if (keywordHits.length >= 3) score += 10;

    return {
      title,
      description,
      tags,
      seoScore: Math.min(score, 100)
    };
  } catch (err) {
    console.error("SEO Extraction Failed", err);
    return null;
  }
}
