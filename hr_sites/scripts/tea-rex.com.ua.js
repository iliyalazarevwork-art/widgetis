// source: https://tea-rex.com.ua/
// extracted: 2026-05-07T21:22:55.164Z
// scripts: 1

// === script #1 (length=1001) ===
document.addEventListener("DOMContentLoaded", function() {
  const originalInput = document.querySelector("input[name=\"Recipient[delivery_name]\"]");
  if (!originalInput) return;

  originalInput.style.display = "none";

  const nameInputs = ["Прізвище", "Ім'я", "По батькові"].map((label, index) => {
    const input = document.createElement("input");
    input.type = "text";
    input.required = true;
    input.placeholder = label;
    input.className = `input field ${label.toLowerCase().replace(/\s/g, "-")}`;
    input.style = `margin-bottom: ${index === 2 ? 0 : 5}px;`;

    if (originalInput.value) {
      const names = originalInput.value.split(" ");
      input.value = names[index];
    }

    originalInput.parentElement.appendChild(input);

    input.addEventListener("input", () => {
      originalInput.value = [...nameInputs]
        .map((input) => input.value.trim())
        .filter(Boolean)
        .join(" ");
    });

    return input;
  });
});
