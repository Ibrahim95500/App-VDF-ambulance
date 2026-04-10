import * as fs from 'fs';

let content = fs.readFileSync('src/scripts/amc-agent/index.ts', 'utf-8');

content = content.replace(
    'const alertedCoursesArray = Array.from(alertedCourses);',
    'const alertedCoursesArray = Array.from(alertedCourses);\n    const manualRejectsArray = Array.from(manualRejects);'
);

content = content.replace(
    '({ manualIds, alertedIds, withFilters }: { manualIds: string[], alertedIds: string[], withFilters: boolean })',
    '({ manualIds, alertedIds, manualRejectIds, withFilters }: { manualIds: string[], alertedIds: string[], manualRejectIds: string[], withFilters: boolean })'
);

content = content.replace(
    'let result = { clicked: false, isManual: false, num: "", departText: "", arriveeText: "", demandeurText: "", foundNotVip: false, allNums: [] as string[] };',
    'let result = { clicked: false, isManual: false, isRejected: false, num: "", departText: "", arriveeText: "", demandeurText: "", foundNotVip: false, allNums: [] as string[] };'
);

content = content.replace(
    'const isManualTriggered = manualIds.includes(result.num);',
    `const isManualTriggered = manualIds.includes(result.num);
                    const isManualRejected = manualRejectIds.includes(result.num);`
);

content = content.replace(
    /if \(isVIP \|\| isManualTriggered\) \{/,
    `if (isManualRejected) {
                        const rejectBtn = row.querySelector('input[src*="croix_supprime"], img[src*="croix_supprime"], a[title*="Refuser"]');
                        if (rejectBtn) {
                            try {
                                if (rejectBtn.tagName === 'IMG' && rejectBtn.parentElement && rejectBtn.parentElement.tagName === 'A') {
                                    rejectBtn.parentElement.click();
                                } else {
                                    (rejectBtn as HTMLElement).click();
                                }
                            } catch(e) {}
                            result.isRejected = true;
                            break; 
                        }
                    } else if (isVIP || isManualTriggered) {`
);

content = content.replace(
    '}, { manualIds: manualClicksArray, alertedIds: alertedCoursesArray, withFilters });',
    '}, { manualIds: manualClicksArray, alertedIds: alertedCoursesArray, manualRejectIds: manualRejectsArray, withFilters });'
);

content = content.replace(
    `if (extraction.isManual) {
        manualClicks.delete(extraction.num); // Reset memory
    }`,
    `if (extraction.isManual) {
        manualClicks.delete(extraction.num); // Reset memory
    }
    if (extraction.isRejected) {
        manualRejects.delete(extraction.num); // Reset memory
    }`
);

content = content.replace(
    `if (!extraction.clicked) {
        // Handle ignored`,
    `if (!extraction.clicked && !extraction.isRejected) {
        // Handle ignored`
);

fs.writeFileSync('src/scripts/amc-agent/index.ts', content);
