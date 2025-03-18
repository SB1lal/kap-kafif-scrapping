import XlsxPopulate from 'xlsx-populate';
 
export function writeToFile(kafifs)
{
    XlsxPopulate.fromFileAsync("./kafif_deger.xlsx")
    .then(workbook => {
        const sheet = workbook.sheet("Sayfa1");
        kafifs.forEach((kafif, index) => {
            sheet.cell(`A${index + 2}`).value(kafif.name);
            sheet.cell(`B${index + 2}`).value(kafif.v1);
            sheet.cell(`C${index + 2}`).value(kafif.v2);
            sheet.cell(`D${index + 2}`).value(kafif.v3);
            sheet.cell(`E${index + 2}`).value(kafif.v4);
            sheet.cell(`F${index + 2}`).value(kafif.v5);
            sheet.cell(`G${index + 2}`).value(kafif.v6);
			sheet.cell(`H${index + 2}`).value(kafif.v7);
        });
        return workbook.toFileAsync("./out.xlsx");
    });
}
