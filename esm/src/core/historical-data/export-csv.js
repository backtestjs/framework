"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFileCSV = void 0;
const csv_1 = require("../../helpers/csv");
async function exportFileCSV(name, rootPath = "./csv") {
    if (!name) {
        return { error: false, data: "Name is required" };
    }
    return (0, csv_1.exportCSV)(name, rootPath);
}
exports.exportFileCSV = exportFileCSV;
//# sourceMappingURL=export-csv.js.map