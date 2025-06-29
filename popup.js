document.getElementById("extractButton").addEventListener("click", () => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: extractUrls, 
    },
    (results) => {
      
      const fullUrls = results[0].result;

     
      if (fullUrls && fullUrls.length > 0) {
        const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                  <title>Extracted URLs</title>
                  <style>
                      body { 
                          font-family: Arial, sans-serif; 
                          margin: 20px; 
                          background-color: #f4f4f4; 
                          color: #333;
                      }
                      h1 { color: #0056b3; }
                      ul { list-style-type: none; padding: 0; }
                      li { 
                          margin-bottom: 8px; 
                          background-color: #fff; 
                          padding: 10px; 
                          border-radius: 5px; 
                          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      }
                      a { color: #007bff; text-decoration: none; }
                      a:hover { text-decoration: underline; }
                      .no-results { color: #dc3545; font-weight: bold; }
                  </style>
              </head>
              <body>
                  <h1>Extracted Full URLs</h1>
                  <ul>
                      ${fullUrls
                        .map(
                          (url) =>
                            `<li><a href="${url}" target="_blank">${url}</a></li>`
                        )
                        .join("")}
                  </ul>
              </body>
              </html>
          `;

        
        chrome.tabs.create({
          url:
            "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent),
        });
      } else {
        
        chrome.tabs.create({
          url:
            "data:text/html;charset=utf-8," +
            encodeURIComponent("<h1>No relative URLs found.</h1>"),
        });
      }
    }
  );
});



function extractUrls() {
  return new Promise((resolve) => {
    const scripts = document.getElementsByTagName("script");
    const regex = /(?<=["'`])\/[a-zA-Z0-9_?&=\/\-\#\.]*(?=["'`])/g;
    const results = new Set();

    
    const baseUrl = window.location.origin; 

    let fetchPromises = [];

    for (let i = 0; i < scripts.length; i++) {
      let scriptSrc = scripts[i].src;
      if (scriptSrc) {
        fetchPromises.push(
          fetch(scriptSrc)
            .then((response) => response.text())
            .then((scriptContent) => {
              let matches = scriptContent.matchAll(regex);
              for (let match of matches) {
                // إضافة الـ Full URL للنتائج
                results.add(baseUrl + match[0]);
              }
            })
            .catch((error) => {
              
            })
        );
      }
    }

    Promise.all(fetchPromises).then(() => {
      let pageContent = document.documentElement.outerHTML;
      let matches = pageContent.matchAll(regex);
      for (const match of matches) {
        
        results.add(baseUrl + match[0]);
      }
      resolve(Array.from(results)); 
    });
  });
}


let tab;
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  tab = tabs[0];
});
