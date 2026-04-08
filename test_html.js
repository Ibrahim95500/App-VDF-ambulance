const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const html = `<th style="text-align: left; width: 40px;" class="sorting_asc" tabindex="0" aria-controls="AT_Affectation" rowspan="1" colspan="1" aria-sort="ascending" aria-label="N°
                            : activer pour trier la colonne par ordre d&amp;eacute;croissant">N°
                            </th>`;
const dom = new JSDOM(html);
const th = dom.window.document.querySelector("th");
const text = th.textContent || th.innerText || "";
console.log("Raw text:", JSON.stringify(text));
console.log("Trimmed:", JSON.stringify(text.trim()));
console.log("Lower:", JSON.stringify(text.trim().toLowerCase()));
console.log("Match N°?", text.trim().toLowerCase() === 'n°');
console.log("Match N?", text.trim().toLowerCase() === 'n');
