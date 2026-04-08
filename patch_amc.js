const fs = require('fs');

function patchFile(path) {
    let content = fs.readFileSync(path, 'utf8');

    // Add demandeurIdx in snipeCourse header evaluation
    if (!content.includes('const demandeurIdx =')) {
        content = content.replace(
            /const departIdx = headers\.findIndex[^;]+;/,
            "const demandeurIdx = headers.findIndex((th: any) => (th.innerText || \"\").toLowerCase().normalize(\"NFD\").replace(/[\\u0300-\\u036f]/g, \"\").includes('demandeur'));\n        $&"
        );
    }
    
    // Add demandeur extraction
    if (!content.includes('result.demandeurText =')) {
        content = content.replace(
            /result\.departText = tds\[departIdx\]\.innerText\.trim\(\);/,
            "if (demandeurIdx >= 0) result.demandeurText = tds[demandeurIdx].innerText.trim();\n                    $&"
        );
    }

    fs.writeFileSync(path, content, 'utf8');
}

patchFile('./src/scripts/amc-agent/index.ts');
patchFile('./src/scripts/amc-agent/simulateur.ts');
