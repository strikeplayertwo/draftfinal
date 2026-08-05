import * as fs from "fs";
const opLines: Record<string, string[]> = {"italian.base_line":["g8f6","f8c5","c2c3","d2d3","e1g1"],"french.base_line":["e4e5","c7c5"],"queen's pawn game.base_line":["g8f6","g1f3","c1f4","e2e3"],"caro-kann.base_line":["d2d4","d7d5"],"caro-kann.main_line":["e4e5"],"reti.base_line":["d7d5","c2c4","d5d4"],"london system.base_line":["b8c6","c2c3","b1d2"],"queen's gambit declined.barmen":["e2e3"],"queen's gambit declined.base_line":["g1f3","g8f6","c4d5","b1c3"],"queen's gambit declined.charousek":["g1f3","g8f6","e2e3","c4d5","e6d5","c1f4"],"queen's gambit declined.harrwitz_attack":["e2e3","c7c5"],"queen's gambit declined.modern":["f8e7","e2e3","g1f3"],"queen's gambit declined.ragozin_defense":["c1g5","h7h6","e2e3","e8g8"],"queen's gambit declined.semi_slav":["b8d7","f1d3","c6c5","e1g1"],"queen's gambit declined.semi_tarrasch":["g1f3","b8c6","c4d5","c6d4","c5d4"],"queen's gambit declined.three_knights":["e2e3"],"gruenfeld.5_cxd5":["f6d5","e2e4","d5c3","b2c3","c7c5"],"gruenfeld.base_line":["c4d5","f6d5","d5c3","f8g7"],"gruenfeld.exchange":["g1f3","c7c5","e8g8","b8c6"],"gruenfeld.petrosian":["f6e4","e4g5"],"gruenfeld.russian":["d5c4","b3c4","e2e4","e8g8"],"benoni.3_g6":["d7d6","e2e4","f8g7","e8g8","g1f3","h2h3"],"benoni.base_line":["d4d5","b1c3","d7d6"],"benoni.benko_gambit":[],"benoni.czech":["e6d5","c4d5","d7d6","e2e4","g7g6"],"benoni.main_line":["b1c3","d7d6","e2e4"],"english.agincourt":["g8f6","f1g2","e1g1"],"english.base_line":["b1c3","g2g3","g8f6"],"english.neo_catalan":["e8g8","b2b3","d2d4"],"petrov's.base_line":["f3e5","d7d6","e5f3","f6e4","d2d4","d6d5"],"petrov's.classical_karklins_martinovsky":["f6e4","d1e2","d8e7","d3f4","e4f6","d2d4"],"petrov's.kaufmann_attack":["b1c3","e4c3","d2c3","f8e7"],"petrov's.modern":["d1d4","d7d5","e5d6","e4d6","b8c6","b1c3"],"petrov's.paulsen_attack":["f6e4","c4e3"],"ruy lopez.base_line":["g8f6","e1g1","f6e4"],"ruy lopez.berlin":["e1g1","f6e4","f1e1","e4d6","f3e5","f8e7"],"ruy lopez.closed":["f1e1","b7b5","a4b3","e8g8","c2c3"],"ruy lopez.exchange":["d7c6","e1g1","d2d4","e5d4","d1d4"],"ruy lopez.marshall":["e4d5","f6d5","f3e5","e1e5","c7c6"],"ruy lopez.open":["d2d4","b7b5","a4b3","d7d5","d4e5","c8e6"],"catalan.base_line":["d7d5","f1g2","g1f3","e8g8"],"catalan.closed_main_line":["d1c2"],"catalan.main_line":[],"sicilian.Accelerated_Dragon":["c2c4","f8g7","c1e3","g8f6","b1c3"],"sicilian.alapin":["g8f6","e4e5","g1f3","d2d4","c5d4"],"sicilian.Alapin_Barmen_Defense":["g8f6","g1f3","b8c6","c5d4"],"sicilian.Alapin_Main_Line":["e4e5","f6d5","g1f3","d2d4","c5d4"],"sicilian.Alapin_Nc6":["e4d5","d8d5","e7e5","b1c3","f8b4","g1f3"],"sicilian.base_line":["g1f3","d2d4","c5d4"],"sicilian.closed":["b8c6"],"sicilian.Closed_a6":["g2g3","f1g2","b7b5"],"sicilian.Closed_e6":["b8c6"],"sicilian.Dragon":["c1e3","f8g7","f2f3","e8g8","d1d2","b8c6"],"sicilian.Dragon_Classical":["f8g7","c1e3","e8g8","b8c6"],"sicilian.Dragon_Fianchetto":["f8g7","f1g2","b8c6","d4e2","e8g8"],"sicilian.Dragon_Levenfish":["f8g7","e1g1","c1e3","b8c6"],"sicilian.Dragon_Yugoslav_Attack":["f2f3","f8g7","e8g8","d1d2","b8c6"],"sicilian.Grand_Prix":["g7g6","g1f3","f8g7","e7e6"],"sicilian.Grand_Prix_Accelerated":["e4d5","g8f6","f1b5"],"sicilian.Najdorf":[],"sicilian.Najdorf_Classical":["e7e5","d4b3","f8e7","e1g1"],"sicilian.Najdorf_English_Attack":["e7e5","d4b3","c8e6","f2f3","d1d2"],"sicilian.Najdorf_Main_Line":["f2f4"],"sicilian.Rossolimo_Attack":["e1g1"],"sicilian.Rossolimo_Attack_d6":["e1g1","c8d7","c2c3","g8f6","f1e1","a7a6"],"sicilian.Rossolimo_Attack_e6":["e1g1","g8e7"],"sicilian.Rossolimo_Attack_g6":["e1g1","f8g7","b5c6"],"sicilian.Rossolimo_Attack_Nf6":["e4e5","e1g1","b1c3"],"sicilian.scheveningen":["g2g4","h7h6"],"sicilian.Scheveningen_English_Attack":["e1g1"],"sicilian.Scheveningen_Keres_Attack":["h7h6","h2h4","g4g5"],"sicilian.sveshnikov":["d4b5","d7d6"],"sicilian.Sveshnikov_Main_Line":["g5f6","c3d5","f8e7","c2c3"]};
const openings = ["Italian", "French", "Queen's Pawn Game", "Caro-Kann", "Queen's Indian Defense", "King's Indian Defense", "Reti", "London System", "Queen's Gambit Declined", "Gruenfeld", "Benoni", "English", "Petrov's", "Ruy Lopez", "Catalan", "Sicilian"];

if(!fs.existsSync("public/opening-midarrows")) {
    fs.mkdirSync("public/opening-midarrows");
}

for(const opening of openings){
    const opString = opening.toLowerCase() + ".";
    const filteredEntries: Record<string, string[]> = {};
    //const filteredEntries = Object.entries(opLines).filter(([key]) => key.startsWith(opString));
    for (const key in opLines) {
        //if (record.hasOwnProperty(key)) {
        if(key.startsWith(opString)){
            const values = opLines[key];
            const minusOpString = key.substring(opString.length);
            filteredEntries[minusOpString] = values;
        }
        //}
    }

    const filename = opening.toLowerCase().replace(/[^a-z0-9]/g, "_");
    fs.writeFileSync(
        `public/opening-midarrows/${filename}.json`,
        JSON.stringify(filteredEntries)
    );
    console.log(`Written ${filename}.json with ${Object.keys(filteredEntries).length} lines and ${Object.entries(filteredEntries).reduce((acc, [, arrows]) => acc + arrows.length, 0)} arrows`);
    //for(const [key, midArrows] of Object.entries(filteredEntries)){ }
}