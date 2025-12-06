import PDFDocument from 'pdfkit';

// ===== UTILITY FUNCTIONS =====
function calculateSoundLevels(fanInputPower, staticPressure, motorEfficiency, spf, Q = 1, r = 3) {
    if (!fanInputPower || fanInputPower <= 0 || !staticPressure || staticPressure <= 0) {
        return { lwA: null, lpA: null, motorInputPower: null, octaveLW: [], octaveLP: [] };
    }
    const effValue = motorEfficiency > 0 ? motorEfficiency : 0.85;
    const spfValue = spf != null ? spf / 100 : 0.05;
    const motorInputPower = (fanInputPower / effValue) * (1 + spfValue);
    const lwA = 62 + 10 * Math.log10(motorInputPower) + 10 * Math.log10(staticPressure);
    const distAtten = Math.abs(10 * Math.log10(Q / (4 * Math.PI * r * r)));
    const lpA = lwA - distAtten;

    const corrections = [-31.7, -20.7, -4.2, -6.7, -5.7, -7.7, -10.7, -15.7];
    const octaveLW = corrections.map(c => parseFloat((lwA + c).toFixed(1)));
    const octaveLP = corrections.map(c => parseFloat((lpA + c).toFixed(1)));

    return {
        lwA: parseFloat(lwA.toFixed(1)), lpA: parseFloat(lpA.toFixed(1)),
        motorInputPower: parseFloat(motorInputPower.toFixed(3)), octaveLW, octaveLP
    };
}

class PiecewiseCubicInterpolator {
    constructor(x, y) {
        this.segments = [];
        for (let i = 0; i < x.length - 1; i++) {
            const x0 = x[i], x1 = x[i + 1], y0 = y[i], y1 = y[i + 1];
            const a = (y1 - y0) / (Math.pow(x1, 3) - Math.pow(x0, 3));
            this.segments.push({ xMin: Math.min(x0, x1), xMax: Math.max(x0, x1), a, b: y0 - a * Math.pow(x0, 3) });
        }
    }
    at(xi) {
        for (const s of this.segments) if (xi >= s.xMin && xi <= s.xMax) return s.a * Math.pow(xi, 3) + s.b;
        const s = this.segments[xi < this.segments[0].xMin ? 0 : this.segments.length - 1];
        return s.a * Math.pow(xi, 3) + s.b;
    }
}

function getCurvePoints(xArr, yArr, mult = 1) {
    const pairs = [];
    for (let i = 0; i < (xArr?.length || 0); i++) {
        if (xArr[i] != null && yArr?.[i] != null && !isNaN(xArr[i]) && !isNaN(yArr[i]))
            pairs.push({ x: Number(xArr[i]), y: Number(yArr[i]) * mult });
    }
    pairs.sort((a, b) => a.x - b.x);
    if (pairs.length < 2) return pairs;

    const interp = new PiecewiseCubicInterpolator(pairs.map(p => p.x), pairs.map(p => p.y));
    const xMin = pairs[0].x, xMax = pairs[pairs.length - 1].x;
    return Array.from({ length: 80 }, (_, i) => {
        const x = xMin + (i / 79) * (xMax - xMin);
        return { x, y: interp.at(x) };
    });
}

function fmt(v, d = 0) { return v == null || isNaN(v) ? '-' : Number(v).toFixed(d); }
function fmtPct(v) { return v == null || isNaN(v) ? '-' : (Number(v) * 100).toFixed(1) + '%'; }

// ===== MAIN PDF GENERATOR =====
export function generateFanDatasheetPDF(fanData, userInput, units) {
    const doc = new PDFDocument({ size: 'A4', margin: 46 });
    const W = doc.page.width, H = doc.page.height, M = 46; // 46px margin from left & right
    const cW = W - 2 * M;
    const black = '#000000';

    // Colors for curves
    const greenColor = '#22863a';
    const redColor = '#d73a49';
    const blueColor = '#0366d6';

    // Extract data
    const pred = fanData.predictions || {};
    const blades = fanData.Blades || {};
    const impeller = fanData.Impeller || {};
    const motor = fanData.matchedMotor || {};

    let motorEff = 0.85;
    if (motor?.effCurve?.length > 0) motorEff = motor.effCurve.reduce((a, b) => a + b, 0) / motor.effCurve.length;

    const sound = calculateSoundLevels(pred.FanInputPowerPred, pred.StaticPressurePred, motorEff, userInput?.SPF || 5, 1, 3);
    const bladeMat = blades.material === 'P' ? 'Plastic' : 'Aluminum';

    // ========== HEADER SECTION (270px from top to table) ==========
    const modelNum = fanData.FanModel || 'AF-L-1250-8|30\\AM-8T-7.5';

    doc.fontSize(12).font('Helvetica-Bold').fillColor(black).text(modelNum, M, 20);
    doc.fontSize(8).font('Helvetica').fillColor(black).text('AF Series', M, 35);

    // Empty box for fan image (placeholder)
    doc.rect(W - M - 130, 15, 130, 100).stroke(black);
    doc.fontSize(6).fillColor('#999').text('(Fan Image)', W - M - 85, 60);

    // Start table at 270px from top
    let y = 270;

    // ========== MAIN DATA BOX (Performance + Fan + Motor Data) ==========
    const dataBoxStartY = y;
    const colW = (cW - 8) / 2;
    const rightX = M + colW + 8;
    const rowH = 11;
    const headingPaddingTop = 6;
    const headingPaddingBottom = 4;

    // Left column - Performance Data with underline
    doc.fontSize(8).font('Helvetica-Bold').fillColor(black).text('Performance Data', M + 5, y + headingPaddingTop);
    const perfTextWidth = doc.widthOfString('Performance Data');
    doc.moveTo(M + 5, y + headingPaddingTop + 10).lineTo(M + 5 + perfTextWidth, y + headingPaddingTop + 10).stroke(black);
    y += headingPaddingTop + 10 + headingPaddingBottom;

    const perfRows = [
        ['- Fan Unit No. [As Per Schedule]', ':', 'EX-01'],
        [`- Design Air Flow [${units?.airFlow || 'CFM'}]`, ':', fmt(userInput?.airFlow, 0)],
        [`- Design Static Pressure [${units?.pressure || 'Pa'}]`, ':', fmt(pred.StaticPressurePred, 0)],
        ['- Design Fan Input Power [kW]', ':', fmt(pred.FanInputPowerPred, 2)],
        ['- Design Motor Input Power [kW]', ':', fmt(sound.motorInputPower, 2)],
        ['- Design Fan Static Efficiency [%]', ':', fmtPct(pred.FanStaticEfficiencyPred)],
        ['- Design Fan Total Efficiency [%]', ':', fmtPct(pred.FanTotalEfficiencyPred)],
        ['- Temperature [C°]', ':', fmt(userInput?.TempC, 0)],
        ['- Density [kg/m3]', ':', fmt(fanData.InputDensity, 1)],
        ['- Fan Speed [RPM]', ':', fmt(userInput?.RPM, 0)],
        ['- Sound Pressure @ 3 m [dBA]', ':', fmt(sound.lpA, 1)],
        ['- Sound Power @ 3 m [dBA]', ':', fmt(sound.lwA, 1)],
    ];

    const perfStartY = y;
    perfRows.forEach(r => {
        doc.fontSize(6).font('Helvetica').fillColor(black).text(r[0], M + 5, y + 1, { width: 120, lineBreak: false });
        doc.text(r[1], M + 127, y + 1, { width: 8, lineBreak: false });
        doc.font('Helvetica-Bold').text(r[2], M + 137, y + 1, { width: 60, align: 'right', lineBreak: false });
        y += rowH;
    });

    // Right column - Fan Data with underline
    let ry = dataBoxStartY + headingPaddingTop;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(black).text('Fan Data', rightX + 5, ry);
    const fanTextWidth = doc.widthOfString('Fan Data');
    doc.moveTo(rightX + 5, ry + 10).lineTo(rightX + 5 + fanTextWidth, ry + 10).stroke(black);
    ry += 10 + headingPaddingBottom;

    const fanRows = [
        ['- Impeller Type', ':', 'Axial'],
        ['- Blades Symbol', ':', blades.symbol || 'AM'],
        ['- Blades Material', ':', bladeMat],
        ['- Blades Angle [degree]', ':', fmt(blades.angle, 0)],
        ['- Configurations (Hub-Blades)', ':', impeller.conf || '16-8'],
    ];

    fanRows.forEach(r => {
        doc.fontSize(6).font('Helvetica').fillColor(black).text(r[0], rightX + 5, ry + 1, { width: 110, lineBreak: false });
        doc.text(r[1], rightX + 117, ry + 1, { width: 8, lineBreak: false });
        doc.font('Helvetica-Bold').text(r[2], rightX + 127, ry + 1, { width: 65, align: 'right', lineBreak: false });
        ry += rowH;
    });

    // Motor Data with underline
    ry += headingPaddingTop;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(black).text('Motor Data', rightX + 5, ry);
    const motorTextWidth = doc.widthOfString('Motor Data');
    doc.moveTo(rightX + 5, ry + 10).lineTo(rightX + 5 + motorTextWidth, ry + 10).stroke(black);
    ry += 10 + headingPaddingBottom;

    const motorRows = [
        ['- Motor Model', ':', motor.model || '-'],
        ['- Motor Power [kW]', ':', fmt(motor.powerKW, 1)],
        ['- No. of Poles', ':', fmt(motor.NoPoles, 0)],
        ['- Voltage [V]/Phase/Freq [Hz]', ':', `${motor.Phase === 3 ? '380' : '220'}/${motor.Phase || '-'}/50`],
        ['- Motor Efficiency [%]', ':', fmtPct(motorEff)],
        ['- Insulation Class', ':', motor.insClass || 'F'],
    ];

    motorRows.forEach(r => {
        doc.fontSize(6).font('Helvetica').fillColor(black).text(r[0], rightX + 5, ry + 1, { width: 115, lineBreak: false });
        doc.text(r[1], rightX + 122, ry + 1, { width: 8, lineBreak: false });
        doc.font('Helvetica-Bold').text(r[2], rightX + 132, ry + 1, { width: 60, align: 'right', lineBreak: false });
        ry += rowH;
    });

    const dataBoxEndY = Math.max(y, ry) + 5;

    // Draw border around all data tables
    doc.rect(M, dataBoxStartY, cW, dataBoxEndY - dataBoxStartY).stroke(black);
    // Vertical divider
    doc.moveTo(M + colW + 4, dataBoxStartY).lineTo(M + colW + 4, dataBoxEndY).stroke(black);

    y = dataBoxEndY + 8;

    // ========== SOUND SPECTRUM BAR CHARTS (light blue bars, violet for totals) ==========
    const spectrumW = (cW - 10) / 2;
    const spectrumH = 68;
    const bands = ['62', '125', '250', '500', '1000', '2000', '4000', '8000'];
    const lightBlue = '#87CEEB';
    const violet = '#8A2BE2';
    const numBars = 9; // 8 frequency bands + 1 total
    const labelColW = 22; // Width for Hz/dBA label column
    const barW = (spectrumW - labelColW - 8) / numBars;
    const maxBarH = 28;
    const tableRowH = 9;

    // Left spectrum - Sound Pressure LP (with border)
    doc.rect(M, y, spectrumW, spectrumH).stroke(black);
    doc.fontSize(7).font('Helvetica-Bold').fillColor(black).text('Power spectrum of the sound pressure', M + 3, y + 3, { lineBreak: false });

    const lpBarY = y + 14;
    const tableY = lpBarY + maxBarH + 1;
    const tableX = M + 2;
    const barsStartX = M + labelColW + 2;

    if (sound.octaveLP.length) {
        const allVals = [...sound.octaveLP, sound.lpA];
        const minV = Math.min(...allVals) - 10;
        const maxV = Math.max(...allVals) + 5;
        // Draw 8 frequency bars in light blue
        bands.forEach((b, i) => {
            const val = sound.octaveLP[i];
            const bH = Math.max(4, ((val - minV) / (maxV - minV)) * maxBarH);
            const bX = barsStartX + i * barW;
            doc.rect(bX + 1, lpBarY + maxBarH - bH, barW - 2, bH).fill(lightBlue);
        });
        // Draw LP(A) total bar in violet
        const lpTotalH = Math.max(4, ((sound.lpA - minV) / (maxV - minV)) * maxBarH);
        doc.rect(barsStartX + 8 * barW + 1, lpBarY + maxBarH - lpTotalH, barW - 2, lpTotalH).fill(violet);
    }

    // Draw table grid for LP spectrum (light grey borders)
    const lightGrey = '#CCCCCC';
    doc.strokeColor(lightGrey).lineWidth(0.5);
    // Horizontal lines
    doc.moveTo(tableX, tableY).lineTo(M + spectrumW - 2, tableY).stroke();
    doc.moveTo(tableX, tableY + tableRowH).lineTo(M + spectrumW - 2, tableY + tableRowH).stroke();
    doc.moveTo(tableX, tableY + 2 * tableRowH).lineTo(M + spectrumW - 2, tableY + 2 * tableRowH).stroke();
    // Vertical lines for each column
    doc.moveTo(tableX, tableY).lineTo(tableX, tableY + 2 * tableRowH).stroke();
    doc.moveTo(tableX + labelColW, tableY).lineTo(tableX + labelColW, tableY + 2 * tableRowH).stroke();
    for (let i = 1; i <= numBars; i++) {
        doc.moveTo(barsStartX + i * barW, tableY).lineTo(barsStartX + i * barW, tableY + 2 * tableRowH).stroke();
    }

    // Table row 1: Hz labels + LP(A)
    doc.fontSize(5).font('Helvetica-Bold').fillColor('#4169E1');
    doc.text('Hz', tableX + 2, tableY + 2, { lineBreak: false });
    bands.forEach((b, i) => doc.text(b, barsStartX + i * barW, tableY + 2, { width: barW, align: 'center', lineBreak: false }));
    doc.fillColor(violet).text('LP (A)', barsStartX + 8 * barW, tableY + 2, { width: barW, align: 'center', lineBreak: false });

    // Table row 2: dBA values with white background and black text
    doc.fontSize(5).font('Helvetica-Bold').fillColor('#4169E1');
    doc.text('dBA', tableX + 2, tableY + tableRowH + 2, { lineBreak: false });
    // Text values in black
    doc.fillColor(black);
    sound.octaveLP.forEach((v, i) => doc.text(fmt(v, 1), barsStartX + i * barW, tableY + tableRowH + 2, { width: barW, align: 'center', lineBreak: false }));
    doc.text(fmt(sound.lpA, 1), barsStartX + 8 * barW, tableY + tableRowH + 2, { width: barW, align: 'center', lineBreak: false });

    // Right spectrum - Sound Power LW (with border)
    const rwX = M + spectrumW + 10;
    const rwBarsStartX = rwX + labelColW + 2;
    doc.rect(rwX, y, spectrumW, spectrumH).stroke(black);
    doc.fontSize(7).font('Helvetica-Bold').fillColor(black).text('Power spectrum of the sound power', rwX + 3, y + 3, { lineBreak: false });

    if (sound.octaveLW.length) {
        const allVals = [...sound.octaveLW, sound.lwA];
        const minV = Math.min(...allVals) - 10;
        const maxV = Math.max(...allVals) + 5;
        // Draw 8 frequency bars in light blue
        bands.forEach((b, i) => {
            const val = sound.octaveLW[i];
            const bH = Math.max(4, ((val - minV) / (maxV - minV)) * maxBarH);
            const bX = rwBarsStartX + i * barW;
            doc.rect(bX + 1, lpBarY + maxBarH - bH, barW - 2, bH).fill(lightBlue);
        });
        // Draw LW(A) total bar in violet
        const lwTotalH = Math.max(4, ((sound.lwA - minV) / (maxV - minV)) * maxBarH);
        doc.rect(rwBarsStartX + 8 * barW + 1, lpBarY + maxBarH - lwTotalH, barW - 2, lwTotalH).fill(violet);
    }

    // Draw table grid for LW spectrum (light grey borders)
    doc.strokeColor(lightGrey).lineWidth(0.5);
    const rwTableX = rwX + 2;
    // Horizontal lines
    doc.moveTo(rwTableX, tableY).lineTo(rwX + spectrumW - 2, tableY).stroke();
    doc.moveTo(rwTableX, tableY + tableRowH).lineTo(rwX + spectrumW - 2, tableY + tableRowH).stroke();
    doc.moveTo(rwTableX, tableY + 2 * tableRowH).lineTo(rwX + spectrumW - 2, tableY + 2 * tableRowH).stroke();
    // Vertical lines
    doc.moveTo(rwTableX, tableY).lineTo(rwTableX, tableY + 2 * tableRowH).stroke();
    doc.moveTo(rwTableX + labelColW, tableY).lineTo(rwTableX + labelColW, tableY + 2 * tableRowH).stroke();
    for (let i = 1; i <= numBars; i++) {
        doc.moveTo(rwBarsStartX + i * barW, tableY).lineTo(rwBarsStartX + i * barW, tableY + 2 * tableRowH).stroke();
    }

    // Table row 1: Hz labels + LW(A)
    doc.fontSize(5).font('Helvetica-Bold').fillColor('#4169E1');
    doc.text('Hz', rwTableX + 2, tableY + 2, { lineBreak: false });
    bands.forEach((b, i) => doc.text(b, rwBarsStartX + i * barW, tableY + 2, { width: barW, align: 'center', lineBreak: false }));
    doc.fillColor(violet).text('LW (A)', rwBarsStartX + 8 * barW, tableY + 2, { width: barW, align: 'center', lineBreak: false });

    // Table row 2: dBA values with white background and black text
    doc.fontSize(5).font('Helvetica-Bold').fillColor('#4169E1');
    doc.text('dBA', rwTableX + 2, tableY + tableRowH + 2, { lineBreak: false });
    // Text values in black
    doc.fillColor(black);
    sound.octaveLW.forEach((v, i) => doc.text(fmt(v, 1), rwBarsStartX + i * barW, tableY + tableRowH + 2, { width: barW, align: 'center', lineBreak: false }));
    doc.text(fmt(sound.lwA, 1), rwBarsStartX + 8 * barW, tableY + tableRowH + 2, { width: barW, align: 'center', lineBreak: false });

    y = y + spectrumH + 5;

    // ========== PERFORMANCE GRAPH (compact, fixed height to fit on page) ==========
    const graphX = M + 45;
    const graphY2 = y + 8;
    const graphW = cW - 55;
    const graphH = 200; // Fixed compact height

    // Get curve data
    const airflow = fanData.AirFlowNew || [];
    const staticP = fanData.StaticPressureNew || [];
    const power = fanData.FanInputPowerNew || [];
    const effT = fanData.FanTotalEfficiency || [];

    const pCurve = getCurvePoints(airflow, staticP);
    const pwCurve = getCurvePoints(airflow, power);
    const effCurve = getCurvePoints(airflow, effT, 100);

    // Find data ranges
    let dataXMin = Infinity, dataXMax = -Infinity;
    let pMax = 0, pwMax = 0;

    pCurve.forEach(pt => {
        if (pt.x < dataXMin) dataXMin = pt.x;
        if (pt.x > dataXMax) dataXMax = pt.x;
        if (pt.y > pMax) pMax = pt.y;
    });
    pwCurve.forEach(pt => { if (pt.y > pwMax) pwMax = pt.y; });

    // Calculate nice axis ranges
    const xMin = 0;
    const xMax = Math.ceil(dataXMax / 5000) * 5000 || 40000;
    const pMin = 0;
    pMax = Math.ceil(pMax / 50) * 50 || 700;
    const pwMin = 0;
    pwMax = Math.ceil(pwMax * 1.3 * 10) / 10 || 8;
    const effMin = 0, effMax = 100;

    // Draw graph border
    doc.rect(graphX, graphY2, graphW, graphH).fill('white').stroke(black);

    // Grid lines
    doc.strokeColor('#ddd').lineWidth(0.3);
    for (let i = 1; i < 8; i++) {
        const gx = graphX + (i / 8) * graphW;
        doc.moveTo(gx, graphY2).lineTo(gx, graphY2 + graphH).stroke();
    }
    for (let i = 1; i < 10; i++) {
        const gy = graphY2 + (i / 10) * graphH;
        doc.moveTo(graphX, gy).lineTo(graphX + graphW, gy).stroke();
    }

    // Y-axis labels (left side) - colored
    doc.fontSize(6).font('Helvetica-Bold');
    doc.fillColor(greenColor).text('η [%]', M, graphY2 - 8);
    doc.fillColor(redColor).text('Pshaft [kW]', M, graphY2 + 2);
    doc.fillColor(blueColor).text(`Ps [${units?.pressure || 'Pa'}]`, M, graphY2 + 12);

    // Y-axis scales (only every other line to save space)
    doc.fontSize(4).font('Helvetica');
    for (let i = 0; i <= 10; i += 2) {
        const yPos = graphY2 + graphH - (i / 10) * graphH;
        doc.fillColor(greenColor).text(`${i * 10}%`, M, yPos - 2, { width: 14, align: 'right', lineBreak: false });
        doc.fillColor(redColor).text(fmt(i * pwMax / 10, 1), M + 15, yPos - 2, { width: 14, align: 'right', lineBreak: false });
        doc.fillColor(blueColor).text(fmt(i * pMax / 10, 0), M + 30, yPos - 2, { width: 14, align: 'right', lineBreak: false });
    }

    // X-axis labels
    doc.fontSize(6).font('Helvetica-Bold').fillColor(black);
    doc.text(`Q [${units?.airFlow || 'CFM'}]`, graphX + graphW / 2 - 25, graphY2 + graphH + 10, { lineBreak: false });

    doc.fontSize(4).font('Helvetica');
    for (let i = 0; i <= 8; i += 2) {
        const xPos = graphX + (i / 8) * graphW;
        const xVal = xMin + (i / 8) * (xMax - xMin);
        doc.text(fmt(xVal, 0), xPos - 10, graphY2 + graphH + 2, { width: 20, align: 'center', lineBreak: false });
    }

    // Draw curves with colors
    const drawCurve = (pts, yMin, yMax, color) => {
        if (pts.length < 2) return;
        doc.strokeColor(color).lineWidth(1.2);

        let started = false;
        pts.forEach(pt => {
            const px = graphX + ((pt.x - xMin) / (xMax - xMin)) * graphW;
            const py = graphY2 + graphH - ((pt.y - yMin) / (yMax - yMin)) * graphH;

            if (px >= graphX && px <= graphX + graphW) {
                const clampedPy = Math.max(graphY2, Math.min(graphY2 + graphH, py));
                if (!started) { doc.moveTo(px, clampedPy); started = true; }
                else doc.lineTo(px, clampedPy);
            }
        });
        doc.stroke();
    };

    // Draw curves with different colors
    drawCurve(pCurve, pMin, pMax, blueColor);      // Static Pressure - Blue
    drawCurve(pwCurve, pwMin, pwMax, redColor);    // Power - Red
    drawCurve(effCurve, effMin, effMax, greenColor); // Efficiency - Green

    // Operating point
    const opX = userInput?.airFlow;
    if (opX && opX >= xMin && opX <= xMax) {
        const opPx = graphX + ((opX - xMin) / (xMax - xMin)) * graphW;

        // Vertical dashed line
        doc.strokeColor('#999').lineWidth(0.5).dash(2, { space: 2 });
        doc.moveTo(opPx, graphY2).lineTo(opPx, graphY2 + graphH).stroke();
        doc.undash();

        // Operating point markers
        if (pred.StaticPressurePred && pred.StaticPressurePred >= pMin && pred.StaticPressurePred <= pMax) {
            const opPy = graphY2 + graphH - ((pred.StaticPressurePred - pMin) / (pMax - pMin)) * graphH;
            doc.circle(opPx, opPy, 3).fill(blueColor);
        }
        if (pred.FanInputPowerPred && pred.FanInputPowerPred >= pwMin && pred.FanInputPowerPred <= pwMax) {
            const opPy = graphY2 + graphH - ((pred.FanInputPowerPred - pwMin) / (pwMax - pwMin)) * graphH;
            doc.circle(opPx, opPy, 3).fill(redColor);
        }
        if (pred.FanTotalEfficiencyPred) {
            const effVal = pred.FanTotalEfficiencyPred * 100;
            if (effVal >= effMin && effVal <= effMax) {
                const opPy = graphY2 + graphH - ((effVal - effMin) / (effMax - effMin)) * graphH;
                doc.circle(opPx, opPy, 3).fill(greenColor);
            }
        }
    }

    // Legend (top right of graph)
    const legendX = graphX + graphW - 85;
    const legendY2 = graphY2 + 5;
    doc.fontSize(5).font('Helvetica');

    doc.strokeColor(blueColor).lineWidth(1.2);
    doc.moveTo(legendX, legendY2 + 3).lineTo(legendX + 12, legendY2 + 3).stroke();
    doc.fillColor(black).text('Ps - Pressure', legendX + 15, legendY2, { lineBreak: false });

    doc.strokeColor(redColor);
    doc.moveTo(legendX, legendY2 + 10).lineTo(legendX + 12, legendY2 + 10).stroke();
    doc.text('Pshaft - Power', legendX + 15, legendY2 + 7, { lineBreak: false });

    doc.strokeColor(greenColor);
    doc.moveTo(legendX, legendY2 + 17).lineTo(legendX + 12, legendY2 + 17).stroke();
    doc.text('η - Efficiency', legendX + 15, legendY2 + 14, { lineBreak: false });

    return doc;
}

export default { generateFanDatasheetPDF };
