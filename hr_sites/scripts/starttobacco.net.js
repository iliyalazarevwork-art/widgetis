// source: https://starttobacco.net/
// extracted: 2026-05-07T21:19:54.207Z
// scripts: 1

// === script #1 (length=1014) ===
document.addEventListener("DOMContentLoaded", function () {
    let questions = document.querySelectorAll("h2.faq-question");
    let answers = document.querySelectorAll("p.faq-answer");
    
    let faqArray = [];

    questions.forEach((question, index) => {
        if (answers[index]) {
            faqArray.push({
                "@type": "Question",
                "name": question.innerText,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": answers[index].innerText
                }
            });
        }
    });

    if (faqArray.length > 0) {
        let schemaData = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqArray
        };

        let scriptTag = document.createElement("script");
        scriptTag.type = "application/ld+json";
        scriptTag.innerText = JSON.stringify(schemaData);
        document.head.appendChild(scriptTag);
    }
});
