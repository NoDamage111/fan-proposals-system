import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FANS_EXCEL_FILE_PATH = path.join(__dirname, 'data', 'fans.xlsx');
const MOTORS_EXCEL_FILE_PATH = path.join(__dirname, 'data', 'motors.xlsx');
const FIVESCHEME_EXCEL_FILE_PATH = path.join(__dirname, 'data', '5_scheme.xlsx');
const app = express();
const PORT = process.env.PORT || 3001;

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://fan-proposals.vercel.app',
    'https://fan-proposals-system.vercel.app',
    'https://fan-proposals-system-a94dvkewr-nodamage111s-projects.vercel.app',
    'https://*.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test CORS
app.get('/api/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    timestamp: new Date().toISOString()
  });
});

// Supabase клиент
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY
);

// Глобальная переменная для хранения данных
let fansData = [];
let motorsData = [];
let fiveSchemeData = [];

// Функции загрузки данных
async function loadFansData(EXCEL_FILE_PATH) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    fansData = XLSX.utils.sheet_to_json(worksheet) || [];
    console.log(`Загружено ${fansData.length} вентиляторов`);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    fansData = [];
  }
}

async function loadMotorsData(EXCEL_FILE_PATH) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    motorsData = XLSX.utils.sheet_to_json(worksheet) || [];
    console.log(`Загружено ${motorsData.length} моторов`);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    motorsData = [];
  }
}

async function loadFiveData(EXCEL_FILE_PATH) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    fiveSchemeData = XLSX.utils.sheet_to_json(worksheet) || [];
    console.log(`Загружено ${fiveSchemeData.length} скоростей`);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    fiveSchemeData = [];
  }
}

// Функция для создания SVG графика
function createSVGGraph(dataset1, dataset2, dataset3, dataset4, options = {}) {
  const width = 600;
  const height = 600;
  const padding = 20;
  
  // Вычисляем границы данных
  const allDataPoints = [...dataset1, ...dataset2, ...dataset3, ...dataset4];
  const xValues = allDataPoints.map(point => point.x).filter(x => x != null && !isNaN(x));
  const yValues = allDataPoints.map(point => point.y).filter(y => y != null && !isNaN(y));
  
  if (xValues.length === 0 || yValues.length === 0) {
    return null;
  }
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  // Добавляем отступы
  const xRange = maxX - minX;
  const yRange = maxY - minY;
  const xMin = Math.max(0, minX - xRange * 0.05);
  const xMax = maxX + xRange * 0.05;
  const yMin = Math.max(0, minY - yRange * 0.05);
  const yMax = maxY + yRange * 0.05;
  
  // Функции для преобразования координат
  const scaleX = (x) => padding + (x - xMin) / (xMax - xMin) * (width - 2 * padding);
  const scaleY = (y) => height - padding - (y - yMin) / (yMax - yMin) * (height - 2 * padding);
  
  // Создаем SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Фон -->
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Сетка -->
  <g stroke="#f0f0f0" stroke-width="1">
    <!-- Вертикальные линии -->
    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"/>
    <line x1="${width - padding}" y1="${padding}" x2="${width - padding}" y2="${height - padding}"/>
    <!-- Горизонтальные линии -->
    <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}"/>
    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"/>
  </g>
  
  <!-- Оси -->
  <g stroke="#000" stroke-width="2">
    <!-- Ось X -->
    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"/>
    <!-- Ось Y -->
    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"/>
  </g>
  
  <!-- Подписи осей -->
  <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="Arial" font-size="12" fill="#333">
    ${options.xLabel || 'Производительность, м³/ч'}
  </text>
  <text x="15" y="${height / 2}" text-anchor="middle" transform="rotate(-90, 15, ${height / 2})" font-family="Arial" font-size="12" fill="#333">
    ${options.yLabel || 'Давление, Па'}
  </text>
  
  <!-- Заголовок -->
  <text x="${width / 2}" y="25" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#333">
    ${options.title || 'Аэродинамическая характеристика'}
  </text>`;
  
  // Основная характеристика вентилятора (синяя линия)
  if (dataset1.length > 0) {
    svg += `\n  <!-- Основная характеристика -->\n  <path d="`;
    dataset1.forEach((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      if (index === 0) {
        svg += `M ${x} ${y} `;
      } else {
        svg += `L ${x} ${y} `;
      }
    });
    svg += `" stroke="#3366cc" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
  }
  
  // Интерполяция (красная пунктирная линия)
  if (dataset2.length > 0) {
    svg += `\n  <!-- Интерполяция -->\n  <path d="`;
    dataset2.forEach((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      if (index === 0) {
        svg += `M ${x} ${y} `;
      } else {
        svg += `L ${x} ${y} `;
      }
    });
    svg += `" stroke="#dc3912" stroke-width="2" fill="none" stroke-dasharray="8,4" stroke-linejoin="round"/>`;
  }
  
  // Рабочая точка (оранжевый круг)
  if (dataset3.length > 0) {
    dataset3.forEach(point => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      svg += `\n  <circle cx="${x}" cy="${y}" r="6" fill="#ff9900" stroke="#cc7a00" stroke-width="2"/>`;
    });
  }
  
  // Заданная точка (зеленый квадрат)
  if (dataset4.length > 0) {
    dataset4.forEach(point => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      svg += `\n  <rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="#109618" stroke="#0d7512" stroke-width="2"/>`;
    });
  }
  
  // Легенда
  svg += `\n  <!-- Легенда -->\n  <g font-family="Arial" font-size="11">`;
  
  const legendItems = [
    { color: '#3366cc', text: 'Характеристика вентилятора', y: 45 },
    { color: '#dc3912', text: 'Интерполяция', y: 65 },
    { color: '#ff9900', text: 'Рабочая точка', y: 85 },
    { color: '#109618', text: 'Заданная точка', y: 105 }
  ];
  
  legendItems.forEach(item => {
    svg += `\n    <rect x="${width - 150}" y="${item.y - 8}" width="12" height="12" fill="${item.color}" stroke="#666" stroke-width="1"/>`;
    svg += `\n    <text x="${width - 130}" y="${item.y}" fill="#333">${item.text}</text>`;
  });
  
  svg += `\n  </g>`;
  
  // Деления и подписи на осях
  svg += `\n  <!-- Деления осей -->\n  <g font-family="Arial" font-size="10" fill="#666">`;
  
  // Деления оси X
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const value = xMin + (xMax - xMin) * i / xTicks;
    const x = scaleX(value);
    svg += `\n    <line x1="${x}" y1="${height - padding}" x2="${x}" y2="${height - padding + 5}" stroke="#000" stroke-width="1"/>`;
    svg += `\n    <text x="${x}" y="${height - padding + 18}" text-anchor="middle">${formatTickValue(value)}</text>`;
  }
  
  // Деления оси Y
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const value = yMin + (yMax - yMin) * i / yTicks;
    const y = scaleY(value);
    svg += `\n    <line x1="${padding}" y1="${y}" x2="${padding - 5}" y2="${y}" stroke="#000" stroke-width="1"/>`;
    svg += `\n    <text x="${padding - 10}" y="${y + 4}" text-anchor="end">${formatTickValue(value)}</text>`;
  }
  
  svg += `\n  </g>\n</svg>`;
  
  // Конвертируем SVG в base64
  const base64SVG = Buffer.from(svg).toString('base64');
  
  return {
    svg: svg,
    base64: `data:image/svg+xml;base64,${base64SVG}`,
    format: 'image/svg+xml',
    width: width,
    height: height,
    dataRanges: {
      x: { min: xMin, max: xMax },
      y: { min: yMin, max: yMax }
    }
  };
}

// Вспомогательная функция для форматирования значений делений
function formatTickValue(value) {
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k';
  }
  return Math.round(value).toString();
}

// Функция построения графиков
async function plotTwoCurvesToJPG(dataset1, dataset2, dataset3, dataset4, outputPath, options = {}) {
  try {
    console.log('Создание SVG графика:', {
      dataset1: dataset1.length,
      dataset2: dataset2.length,
      dataset3: dataset3.length,
      dataset4: dataset4.length
    });
    
    // Фильтруем валидные данные
    const validDataset1 = dataset1.filter(p => p.x != null && p.y != null && !isNaN(p.x) && !isNaN(p.y));
    const validDataset2 = dataset2.filter(p => p.x != null && p.y != null && !isNaN(p.x) && !isNaN(p.y));
    const validDataset3 = dataset3.filter(p => p.x != null && p.y != null && !isNaN(p.x) && !isNaN(p.y));
    const validDataset4 = dataset4.filter(p => p.x != null && p.y != null && !isNaN(p.x) && !isNaN(p.y));
    
    if (validDataset1.length === 0) {
      console.error('Нет валидных данных для построения графика');
      return {
        success: false,
        error: 'Нет валидных данных для построения графика'
      };
    }
    
    const graph = createSVGGraph(validDataset1, validDataset2, validDataset3, validDataset4, options);
    
    if (!graph) {
      return {
        success: false,
        error: 'Не удалось создать график'
      };
    }
    
    return {
      success: true,
      graph: {
        svg: graph.svg,
        base64: graph.base64,
        format: graph.format,
        width: graph.width,
        height: graph.height,
        dataRanges: graph.dataRanges,
        additionalData: {
          pointsCount: validDataset1.length + validDataset2.length + validDataset3.length + validDataset4.length,
          createdAt: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error('Ошибка генерации SVG графика:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function leastSquaresInterpolation(points, degree) {
  let X = [];
  let Y = [];
  const n = points.length;
  const m = degree + 1;

  for (let i = 0; i < m; i++) {
    X[i] = new Array(m).fill(0);
    Y[i] = 0;
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += Math.pow(points[k].x, i + j);
      }
      X[i][j] = sum;
    }

    let sumY = 0;
    for (let k = 0; k < n; k++) {
      sumY += points[k].y * Math.pow(points[k].x, i);
    }
    Y[i] = sumY;
  }

  for (let k = 0; k < m; k++) {
    let max = Math.abs(X[k][k]);
    let maxRow = k;
    for (let i = k + 1; i < m; i++) {
      if (Math.abs(X[i][k]) > max) {
        max = Math.abs(X[i][k]);
        maxRow = i;
      }
    }

    for (let i = k; i < m; i++) {
      let tmp = X[maxRow][i];
      X[maxRow][i] = X[k][i];
      X[k][i] = tmp;
    }
    let tmp = Y[maxRow];
    Y[maxRow] = Y[k];
    Y[k] = tmp;

    for (let i = k + 1; i < m; i++) {
      let c = -X[i][k] / X[k][k];
      for (let j = k; j < m; j++) {
        if (k === j) {
          X[i][j] = 0;
        } else {
          X[i][j] += c * X[k][j];
        }
      }
      Y[i] += c * Y[k];
    }
  }

  let coefficients = new Array(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    coefficients[i] = Y[i] / X[i][i];
    for (let j = i - 1; j >= 0; j--) {
      Y[j] -= X[j][i] * coefficients[i];
    }
  }

  return function (x) {
    let y = 0;
    for (let i = 0; i < coefficients.length; i++) {
      y += coefficients[i] * Math.pow(x, i);
    }
    return y;
  };
}

function getInterpolateArray(baseArray, degree, stepCount) {
  let interpolateArray = []
  let step = (baseArray[baseArray.length - 1].x - baseArray[0].x) / stepCount

  let interpolate = leastSquaresInterpolation(baseArray, degree)

  for (let i = 0; i <= stepCount; i++) {
    let x = baseArray[0].x + i * step
    let y = interpolate(x)

    let tempPoint = {}

    tempPoint.x = x
    tempPoint.y = y

    interpolateArray.push(tempPoint)
  }

  return interpolateArray
}

function getArrayCurve(fan, startFirstMessage, endFirstMessage, startSecondMessage, endSecondMessage, endSecondMessageEnd) {
  const resultArray = [];
  let i = 1;

  while (startFirstMessage + `${i}` + endFirstMessage in fan) {
    let tempObj = {}

    tempObj.x = Number(fan[startFirstMessage + `${i}` + endFirstMessage]);
    tempObj.y = Number(fan[startSecondMessage + `${i}` + endSecondMessage]) || Number(fan[startSecondMessage + `${i}` + endSecondMessage + `${i}` + endSecondMessageEnd] || 0);

    if (tempObj.x == '0') {
      break
    }

    resultArray.push(tempObj)

    i++;
  }

  return resultArray
}

function getCross(curve, kpd, point) {
  let k = point.y / point.x / point.x

  if (curve[0].y < curve[0].x * curve[0].x * k || curve[curve.length - 1].y > curve[curve.length - 1].x * curve[curve.length - 1].x * k) {
    console.log("ne popali");
    return false
  }

  let currentIndex = curve.length / 2
  let step = curve.length / 2

  for (let i = 0; i <= 10; i++) {
    step = Math.floor(step / 2)
    if (curve[currentIndex].y > curve[currentIndex].x * curve[currentIndex].x * k) {
      currentIndex = currentIndex + step
    } else {
      currentIndex = currentIndex - step
    }
  }

  return [{
    x: Math.floor(curve[currentIndex].x),
    y: Math.floor(curve[currentIndex].x * curve[currentIndex].x * k),
    kpd: Math.floor(kpd[currentIndex].y)
  }]
}

// Инициализация загрузки
loadFansData(FANS_EXCEL_FILE_PATH);
loadMotorsData(MOTORS_EXCEL_FILE_PATH);
loadFiveData(FIVESCHEME_EXCEL_FILE_PATH);

// Обработчик для подбора вентиляторов
app.post('/api/fans/select', async (req, res) => {
  try {
    let baseCurveArray = []
    let baseKpdArray = []
    let curveArray = []
    let result = []
    let crossPoint = []
    
    let filteredFans = [...fansData]
    let filteredMotors = [...motorsData]

    const { flow_rate, pressure, system, quantity, type, series, execution, climate, position, rotation, fluctuationPercentUp, fluctuationPercentDown, powerReserve, typeOfMotor, temperature, height, minFreq, maxFreq, calcType, startType, five, notice } = req.body

    console.log('Получен запрос на подбор:', { flow_rate, pressure, type, series });

    if (type) {
      filteredFans = filteredFans.filter(fan => fan['Тип вентилятора'] === type)
    }

    if (series) {
      filteredFans = filteredFans.filter(fan => fan['Серия'] === series || series === 'Все')
    }

    if (execution) {
      filteredFans = filteredFans.filter(fan => fan[execution] === '1')
    }

    if (flow_rate) {
      filteredFans = filteredFans.filter(fan =>
        fan['Макс. расход, м3/ч'] >= flow_rate &&
        fan['Мин. расход, м3/ч'] <= flow_rate
      )
    }

    if (pressure) {
      filteredFans = filteredFans.filter(fan =>
        fan['Макс. давление, Па'] >= pressure
      )
    }

    console.log(`После фильтрации осталось: ${filteredFans.length} вентиляторов`);

    filteredFans = filteredFans.filter(fan => {
      baseCurveArray = getArrayCurve(fan, 'Расход ', ', м<sup>3</sup>/ч', 'Давление ', ', Па')
      baseKpdArray = getArrayCurve(fan, 'КПД расход ', ', м<sup>3</sup>/ч', 'КПД значение ', ', % / Мощность в точке ', ', кВт')

      console.log(`Вентилятор ${fan['Модель колеса']}:`, {
        curvePoints: baseCurveArray.length,
        firstPoint: baseCurveArray[0],
        lastPoint: baseCurveArray[baseCurveArray.length - 1]
      });

      const density = 1.2920*(273.15/(273.15+Number(temperature)))*(1-Number(height)/10000)

      baseCurveArray.forEach(point => {
        const pressureDinamic = (calcType == 'Статический')?density*(point.x/fan["Площадь выходного отверстия (не для вентиляторов с безразмерными характеристиками), м2"]/3600)*(point.x/fan["Площадь выходного отверстия (не для вентиляторов с безразмерными характеристиками), м2"]/3600)/2:0
        point.y = Math.floor(point.y-pressureDinamic)
      });

      for (let i = 0; i < baseKpdArray.length; i++) {
        const pressureDinamic = (calcType == 'Статический')?density*(baseKpdArray[i].x/fan["Площадь выходного отверстия (не для вентиляторов с безразмерными характеристиками), м2"]/3600)*(baseKpdArray[i]/fan["Площадь выходного отверстия (не для вентиляторов с безразмерными характеристиками), м2"]/3600)/2:0
        baseKpdArray[i].y = Math.floor(baseKpdArray[i].y*(baseCurveArray[i].y-pressureDinamic)/baseCurveArray[i].y)
      }

      curveArray = getInterpolateArray(baseCurveArray, 3, 1023)
      let kpdArray = getInterpolateArray(baseKpdArray, 3, 1023)
      crossPoint = getCross(curveArray, kpdArray, { x: flow_rate, y: pressure })
      
      if (crossPoint == false) {
        return false
      }

      fan.reqPoint = [{
        x: Number(flow_rate),
        y: Number(pressure)
      }]
      fan.crossPoint = crossPoint
      fan.curveArray = curveArray
      fan.kpdArray = kpdArray
      fan.baseCurveArray = baseCurveArray
      fan.baseKpdArray = baseKpdArray
      fan.require = req.body
      return true
    })

    console.log(`После расчета характеристик осталось: ${filteredFans.length} вентиляторов`);

    // Обработка стандартного подбора
    if (startType != "Частотный преобразователь" && five == false) {
      console.log("Standart подбор");
      filteredFans = filteredFans.filter(fan =>
        fan['Исполнение 5 радиального вентилятора (ременная передача)'] != true
      )

      for (const fan of filteredFans) {
        let motorList = [0.06, 0.09, 0.12, 0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 4.0, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 400];

        let baseSpeed = Math.floor(Number(fan["Макс. частота, об/мин"]) * flow_rate / fan.crossPoint[0].x);
        let arraySpeeds = [740, 980, 1450, 2900];
        let acceptedSpeed = arraySpeeds.filter(speed =>
          speed >= baseSpeed && speed <= fan["Макс. частота, об/мин"]
        );

        if (acceptedSpeed.length === 0) {
          acceptedSpeed = arraySpeeds.filter(speed =>
          speed >= baseSpeed/Math.pow(1+fluctuationPercentDown/100,1/2) && speed <= fan["Макс. частота, об/мин"])
        }

        if (acceptedSpeed.length === 0) {
          continue
        }

        fan.speed = acceptedSpeed[0];
        let kxSpeed = Number(fan["Макс. частота, об/мин"]) / fan.speed;

        fan.baseCurveArray.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        fan.curveArray.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        fan.crossPoint.forEach(point => {
          point.x = Math.floor(point.x / kxSpeed);
          point.y = Math.floor(point.y / kxSpeed / kxSpeed);
          point.kpd = Math.floor(point.kpd)
          point.power = (1+powerReserve/100)*Math.round(10*point.x*point.y/3600/point.kpd)/10
        });

        motorList = motorList.filter(motor => motor>fan.crossPoint[0].power)

        fan.crossPoint.forEach(point => {
          point.power = motorList[0]
        });
        
       if (fan.crossPoint[0].y>fan.reqPoint[0].y*(1+fluctuationPercentUp/100)) {
        continue
       }
       
       if (fan.crossPoint[0].y<fan.reqPoint[0].y*(1-fluctuationPercentDown/100)) {
        continue
       }

        // Генерируем график
        fan.graph = await plotTwoCurvesToJPG(
          fan.baseCurveArray,
          fan.curveArray,
          fan.crossPoint,
          fan.reqPoint,
          fan.ID + '.jpg',
          {
            title: `${fan["Модель колеса"]} - ${fan.speed} об/мин`,
            xLabel: 'Производительность, м³/ч',
            yLabel: 'Давление, Па'
          }
        );

        result.push(fan)
      }
    }

    console.log(`Найдено результатов: ${result.length}`);
    res.json(result.length > 0 ? result : [])
  } catch (error) {
    console.error('Ошибка подбора вентиляторов:', error);
    res.status(500).json({ 
      error: 'Ошибка подбора вентиляторов',
      message: error.message 
    });
  }
});

app.get('/api/fans/structure', (req, res) => {
  res.json({
    count: fansData.length,
    headers: fansData.length > 0 ? Object.keys(fansData[0]) : [],
    sample: fansData.length > 0 ? fansData[0] : null
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});