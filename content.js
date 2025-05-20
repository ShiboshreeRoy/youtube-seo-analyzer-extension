(function () {
  // Listen for messages from popup.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extract_seo_data') {
      const seoData = extractSEOData();
      sendResponse(seoData);
    }
  });

  function extractSEOData() {
    // Title extraction
    const title = document.querySelector('h1.title')?.innerText ||
                  document.querySelector('meta[name="title"]')?.content ||
                  document.title;

    // Description
    const description = document.querySelector('meta[name="description"]')?.content || '';

    // Keywords/Tags from meta
    const keywordsMeta = document.querySelector('meta[name="keywords"]')?.content || '';
    const tags = keywordsMeta.split(',').map(t => t.trim()).filter(Boolean);

    // Additional SEO signals
    const titleLength = title.length;
    const descLength = description.length;

    // SEO Score calculation
    let seoScore = 0;
    if (titleLength >= 30 && titleLength <= 70) seoScore += 25;
    if (descLength >= 100) seoScore += 25;
    if (tags.length >= 5) seoScore += 25;
    if (tags.some(tag => title.toLowerCase().includes(tag.toLowerCase()))) seoScore += 25;

    return {
      title,
      description,
      tags,
      seoScore,
      titleLength,
      descLength
    };
  }
})();
