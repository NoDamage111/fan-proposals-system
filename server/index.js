import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import QuickChart from 'quickchart-js';
import axios from 'axios';
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

// Новая функция генерации графиков с QuickChart
async function plotTwoCurvesToJPG(dataset1, dataset2, dataset3, dataset4, outputPath, options = {}) {
  try {
    const chart = new QuickChart();
    
    // Преобразуем данные в формат для Chart.js
    const chartData = {
      type: 'line',
      data: {
        datasets: [
          {
            label: options.label1 || 'Заданные точки',
            data: dataset1,
            backgroundColor: '#4BC0C0',
            borderColor: '#4BC0C0',
            borderWidth: 2,
            pointRadius: 2,
            showLine: true,
            tension: 0.1
          },
          {
            label: options.label2 || 'Интерполяция',
            data: dataset2,
            backgroundColor: '#FF6384',
            borderColor: '#FF6384',
            borderWidth: 2,
            pointRadius: 1,
            showLine: true,
            tension: 0.1
          },
          {
            label: options.label3 || 'CrossPoint',
            data: dataset3,
            backgroundColor: '#1F6386',
            borderColor: '#1F6386',
            borderWidth: 3,
            pointRadius: 4,
            showLine: false
          },
          {
            label: options.label4 || 'ReqPoint',
            data: dataset4,
            backgroundColor: '#117722',
            borderColor: '#16753b',
            borderWidth: 3,
            pointRadius: 4,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: options.xLabel || 'Производительность, м³/ч'
            }
          },
          y: {
            title: {
              display: true,
              text: options.yLabel || 'Давление, Па'
            },
            beginAtZero: false
          }
        },
        plugins: {
          title: {
            display: true,
            text: options.title || 'Аэродинамическая характеристика'
          },
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    };

    chart.setConfig(chartData);
    chart.setWidth(800);
    chart.setHeight(600);
    chart.setBackgroundColor('white');

    // Получаем URL изображения
    const imageUrl = await chart.getShortUrl();
    
    return {
      success: true,
      graph: {
        url: imageUrl,
        base64: null, // QuickChart не возвращает base64 напрямую
        format: 'image/png',
        additionalData: {
          pointsCount: dataset1.length + dataset2.length + dataset3.length,
          createdAt: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error('Ошибка генерации графика:', error);
    
    // Fallback - возвращаем данные для построения графика на клиенте
    return {
      success: true,
      graph: {
        data: {
          datasets: [
            { label: 'Заданные точки', data: dataset1 },
            { label: 'Интерполяция', data: dataset2 },
            { label: 'CrossPoint', data: dataset3 },
            { label: 'ReqPoint', data: dataset4 }
          ]
        },
        options: {
          title: options.title || 'Аэродинамическая характеристика',
          xLabel: options.xLabel || 'Производительность, м³/ч',
          yLabel: options.yLabel || 'Давление, Па'
        },
        format: 'data' // указываем, что это данные для графика
      }
    };
  }
}

// Остальные функции остаются без изменений
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
            title: fan["Модель колеса"] + " " + fan.speed,
            xLabel: 'Производительность, м3/ч',
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