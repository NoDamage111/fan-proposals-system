<template>
  <!-- Весь template остается без изменений -->
  <v-container>
    <v-card class="pa-6">
      <template v-if="proposalsStore.isLoading && !proposalsStore.currentProposal">
        <v-progress-circular indeterminate></v-progress-circular>
      </template>
      
      <template v-else-if="proposalsStore.error">
        <v-alert type="error">{{ proposalsStore.error }}</v-alert>
      </template>
      
      <template v-else-if="proposalsStore.currentProposal">
        <v-card-title class="text-h4 mb-2">
          {{ proposalsStore.currentProposal.title }}
        </v-card-title>
        
        <v-card-subtitle class="text-h6 mb-4">
          Создано: {{ new Date(proposalsStore.currentProposal.created_at).toLocaleDateString() }}
        </v-card-subtitle>
        
        <v-card-text>
          <p class="text-body-1 mb-6">
            {{ proposalsStore.currentProposal.description || 'Описание отсутствует' }}
          </p>
          
          <v-divider class="my-4"></v-divider>
          
          <v-card-title class="text-h5 pa-0 mb-4">
            Выбранные вентиляторы
          </v-card-title>
          
          <v-alert
            v-if="!proposalsStore.currentProposal.proposal_fans?.length"
            type="info"
          >
            Вентиляторы не добавлены
          </v-alert>
          
          <v-list v-else>
            <v-list-item
              v-for="fan in proposalsStore.currentProposal.proposal_fans"
              :key="fan.id"
              class="mb-4"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-fan" color="primary"></v-icon>
              </template>
              
              <v-list-item-title class="text-h6">
                {{ fan.fan_data["Модель колеса"] }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="mt-2">
                <v-chip
                  v-for="(value, key) in {
                    'Расход': `${fan.fan_data.crossPoint[0].x} м³/ч`,
                    'Давление': `${fan.fan_data.crossPoint[0].y} Па`,
                    'Мощность': `${fan.fan_data.crossPoint[0].power} кВт`,
                    'КПД': `${fan.fan_data.crossPoint[0].kpd} %`
                  }"
                  :key="key"
                  class="mr-2 mb-2"
                  size="small"
                >
                  {{ key }}: {{ value }}
                </v-chip>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn
                  color="primary"
                  variant="outlined"
                  class="ml-2"
                  @click="showFanDetails(fan)"
                >
                  Данные
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-dialog
            v-model="showFanDialog"
            max-width="800px"
            scrollable
          >
            <v-card>
              <v-card-title class="d-flex justify-space-between align-center">
                <span>Технические данные вентилятора</span>
                <v-btn
                  icon
                  @click="showFanDialog = false"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>

              <v-card-text>
                <div v-if="selectedFanData">
                  <v-list>
                    <v-list-item>
                      <v-list-item-title class="text-h6">
                        {{ selectedFanData.fan_data['Модель колеса'] }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        {{ selectedFanData.fan_data['Тип вентилятора'] }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-divider class="my-2"></v-divider>

                    <v-list-item>
                      <v-list-item-title>Основные параметры:</v-list-item-title>
                    </v-list-item>

                    <v-list-item>
                      <div class="parameters-list">
                        <div class="parameter-item">
                          <span class="parameter-label">Фактический расход:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.crossPoint?.[0]?.x || 'Н/Д' }} м³/ч</span>
                        </div>
                        <div class="parameter-item">
                          <span class="parameter-label">Фактическое давление:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.crossPoint?.[0]?.y || 'Н/Д' }} Па</span>
                        </div>
                        <div class="parameter-item">
                          <span class="parameter-label">Мощность:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.crossPoint?.[0]?.power || 'Н/Д' }} кВт</span>
                        </div>
                        <div class="parameter-item">
                          <span class="parameter-label">КПД:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.crossPoint?.[0]?.kpd || 'Н/Д' }} %</span>
                        </div>
                        <div class="parameter-item">
                          <span class="parameter-label">Скорость вращения:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.speed || 'Н/Д' }} об/мин</span>
                        </div>
                      </div>
                    </v-list-item>

                    <v-list-item>
                      <v-card class="mt-4" flat>
                        <v-card-title class="text-subtitle-1">
                          Аэродинамическая характеристика
                        </v-card-title>
                        <v-card-text>
                          <div class="chart-container">
  <img 
    id="fan-dialog-image"
    :src="selectedFanData?.fan_data?.graph?.graph?.base64 || selectedFanData?.fan_data?.graph?.graph?.url" 
    alt="Аэродинамическая характеристика"
    style="max-width: 100%; height: auto;"
    @error="handleImageError"
  />
</div>
                        </v-card-text>
                      </v-card>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-title>Примечание:</v-list-item-title>
                      <v-list-item-subtitle>
                        <div>{{ selectedFanData.fan_data.require?.notice || 'Нет примечания' }}</div>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </div>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  @click="showFanDialog = false"
                >
                  Закрыть
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-divider class="my-4"></v-divider>

        </v-card-text>
        
        <v-card-actions>
          <v-btn
            to="/proposals"
            variant="text"
            color="grey"
          >
            Назад к списку
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="secondary"
            class="mr-2"
            @click="generateRTF"
            :loading="isGeneratingRTF"
            prepend-icon="mdi-file-word-box"
          >
            Сохранить в RTF
          </v-btn>

          <v-btn
            color="primary"
            @click="generatePDF"
            :loading="isGeneratingPDF"
            prepend-icon="mdi-file-pdf-box"
          >
            Сохранить в PDF
          </v-btn>
        </v-card-actions>
      </template>
      
      <template v-else>
        <v-alert type="warning">Предложение не найдено</v-alert>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import { useProposalsStore } from '@/stores/proposals'
import { useRoute } from 'vue-router'
import pdfMake from 'pdfmake/build/pdfmake'
import blueprintImage from '@/components/blueprintexamle.jpg'
import headerImage from '@/components/header.jpg'
import footerImage from '@/components/footer.jpg'

// Устанавливаем шрифты для поддержки кириллицы
const fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
}

pdfMake.fonts = fonts

const proposalsStore = useProposalsStore()
const route = useRoute()

// Данные для диалога
const showFanDialog = ref(false)
const selectedFanData = ref(null)
const isGeneratingPDF = ref(false)
const isGeneratingRTF = ref(false)

onMounted(() => {
  loadProposal()
})

watch(() => route.params.id, () => {
  loadProposal()
})

const loadProposal = async () => {
  if (route.params.id) {
    await proposalsStore.fetchProposalById(route.params.id)
  }
}

const showFanDetails = (fan) => {
  selectedFanData.value = fan
  showFanDialog.value = true
  
  // Даем время на рендеринг диалога
  nextTick(() => {
    const dialogImage = document.querySelector('#fan-dialog-image');
    if (dialogImage && fan.fan_data?.graph?.graph?.base64) {
      dialogImage.src = fan.fan_data.graph.graph.base64;
    }
  });
}

// Функция для загрузки изображения как base64
const loadImageAsBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error)
    return null
  }
}

// Функция для конвертации base64 в ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  try {
    const base64Data = base64.split(',')[1]
    const binaryString = atob(base64Data)
    const length = binaryString.length
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  } catch (error) {
    console.error('Ошибка конвертации base64:', error)
    return null
  }
}

// Функция для загрузки изображения как ArrayBuffer
const loadImageAsArrayBuffer = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(blob)
    })
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error)
    return null
  }
}

// Функция для генерации RTF с колонтитулами и исходной кодировкой
// Функция для генерации RTF с колонтитулами и исходной кодировкой
// Функция для генерации RTF с колонтитулами и исходной кодировкой
// Функция для генерации RTF с колонтитулами и исходной кодировкой
const generateRTF = async () => {
  isGeneratingRTF.value = true
  
  try {
    const proposal = proposalsStore.currentProposal
    if (!proposal || !proposal.proposal_fans?.length) return

    // Загружаем изображения для хэдера и футера
    const headerBuffer = await loadImageAsArrayBuffer(headerImage)
    const footerBuffer = await loadImageAsArrayBuffer(footerImage)
    const blueprintBuffer = await loadImageAsArrayBuffer(blueprintImage)

    // Функция для добавления изображения в RTF
    const addImageToRTF = (buffer, widthGoal, heightGoal) => {
      if (!buffer) return ''
      try {
        const bytes = new Uint8Array(buffer)
        let hexString = ''
        for (let i = 0; i < bytes.length; i++) {
          hexString += bytes[i].toString(16).padStart(2, '0')
        }
        return `{\\pict\\jpegblip\\picwgoal${widthGoal}\\pichgoal${heightGoal}\n${hexString}\n}`
      } catch (error) {
        console.error('Ошибка добавления изображения:', error)
        return ''
      }
    }

    // Функция для конвертации кириллицы в Unicode (исходная версия)
    const toUnicodeRTF = (text) => {
      if (!text) return ''
      let result = ''
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i)
        if (charCode > 127) {
          result += `\\u${charCode}?`
        } else {
          result += text[i]
        }
      }
      return result
    }

    // Функция для создания таблицы в RTF
 // Простая и надежная функция для создания таблиц с сеткой
const createTableRTF = (rows, columns = 2) => {
  let tableRTF = ''
  
  const columnWidth = 5000
  
  rows.forEach(row => {
    // Начало строки с ЧЕРНЫМИ границами
    tableRTF += '{\\trowd'
    tableRTF += '\\trbrdrt\\brdrs\\brdrw100\\brdrcf0' // Верхняя граница - черная
    tableRTF += '\\trbrdrl\\brdrs\\brdrw100\\brdrcf0' // Левая граница - черная
    tableRTF += '\\trbrdrb\\brdrs\\brdrw100\\brdrcf0' // Нижняя граница - черная  
    tableRTF += '\\trbrdrr\\brdrs\\brdrw100\\brdrcf0' // Правая граница - черная
    tableRTF += '\\trgaph100'
    
    // Позиции колонок
    for (let i = 0; i < columns; i++) {
      tableRTF += `\\cellx${(i + 1) * columnWidth}`
    }
    
    // Ячейки
    row.forEach((cell, cellIndex) => {
      const isBold = cell.bold
      const isHeader = cell.fillColor
      const cellContent = toUnicodeRTF(cell.text || cell)
      
      tableRTF += `{` // Начало ячейки
      
      // Границы ячейки - все ЧЕРНЫЕ
      tableRTF += '\\clbrdrt\\brdrs\\brdrw100\\brdrcf0' // Верх
      tableRTF += '\\clbrdrl\\brdrs\\brdrw100\\brdrcf0' // Лево
      tableRTF += '\\clbrdrb\\brdrs\\brdrw100\\brdrcf0' // Низ
      tableRTF += '\\clbrdrr\\brdrs\\brdrw100\\brdrcf0' // Право
      
      // Фон для заголовков
      if (isHeader) {
        tableRTF += '\\clcbpat15' // Светло-серый фон (паттерн 15)
      }
      
      tableRTF += '\\clvertalt\\clpadl100\\clpadt50\\clpadb50\\clpadr100'
      tableRTF += '\\pard\\intbl\\ql'
      
      if (isBold) tableRTF += '\\b'
      tableRTF += ' ' + cellContent + ' '
      if (isBold) tableRTF += '\\b0'
      
      tableRTF += '\\cell}'
    })
    
    tableRTF += '\\row}'
  })
  
  return tableRTF
}

    // Создаем RTF документ с колонтитулами и исходной кодировкой
    let rtfContent = `{\\rtf1\\ansi\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}
{\\*\\generator RTFGenerator 1.0}
\\margl1000\\margr1000\\margt1000\\margb1000
\\f0\\fs24
`

    // Определяем колонтитулы для всего документа
    rtfContent += `{\\header\\pard\\qc ${addImageToRTF(headerBuffer, 12700, 1200)}\\par}
{\\footer\\pard\\qc ${addImageToRTF(footerBuffer, 12700, 1200)}\\par}
`

    // Для каждого вентилятора создаем страницы
    for (const [index, fan] of proposal.proposal_fans.entries()) {
      const fanData = fan.fan_data
      const require = fanData.require || {}

      // СТРАНИЦА 1: Основные данные вентилятора
      if (index > 0) {
        rtfContent += `\\sect\\sbkpage`
      }

      // Заголовок вентилятора
      rtfContent += `\\qc\\b\\fs32 ${toUnicodeRTF(`ВЕНТИЛЯТОР ${index + 1}: ${fanData['Модель колеса'] || 'Неизвестная модель'}`)}\\b0\\fs24\\par\\par`

      // Заданные значения
      rtfContent += `\\qc\\b\\fs28 ${toUnicodeRTF('ЗАДАННЫЕ ЗНАЧЕНИЯ')}\\b0\\fs24\\par\\par`
      console.log(fanData);
      
      const requiredValues = [
        [
          { text: 'Производительность (задано)', bold: true, fillColor: true },
          { text: `${fanData.require.flow_rate || 'Н/Д'} м³/ч` }
        ],
        [
          { text: 'Давление (задано)', bold: true, fillColor: true },
          { text: `${fanData.require.pressure || 'Н/Д'} Па` }
        ],
        [
          { text: 'Исполнение', bold: true, fillColor: true },
          { text: fanData.require.execution || 'Н/Д' }
        ],
        [
          { text: 'Температура перемещаемой среды', bold: true, fillColor: true },
          { text: `${fanData.require.temperature || 'Н/Д'} °C` }
        ],
        [
          { text: 'Тип двигателя', bold: true, fillColor: true },
          { text: fanData.require.startType || 'Н/Д' }
        ],
        [
          { text: 'Резерв мощности', bold: true, fillColor: true },
          { text: `${fanData.require.powerReserve || '0'} %` }
        ]
      ]

      rtfContent += createTableRTF(requiredValues) + '\\par\\par'

      // Технические данные
      rtfContent += `\\qc\\b\\fs28 ${toUnicodeRTF('ТЕХНИЧЕСКИЕ ДАННЫЕ ВЕНТИЛЯТОРА')}\\b0\\fs24\\par\\par`

      const technicalData = [
        [
          { text: 'Название вентилятора', bold: true, fillColor: true },
          { text: fanData['Модель колеса'] || 'Н/Д' }
        ],
        [
          { text: 'Тип вентилятора', bold: true, fillColor: true },
          { text: fanData['Тип вентилятора'] || 'Н/Д' }
        ],
        [
          { text: 'Производительность фактическая', bold: true, fillColor: true },
          { text: `${fanData.crossPoint?.[0]?.x || 'Н/Д'} м³/ч` }
        ],
        [
          { text: 'Давление полное', bold: true, fillColor: true },
          { text: `${fanData.crossPoint?.[0]?.y || 'Н/Д'} Па` }
        ],
        [
          { text: 'Мощность', bold: true, fillColor: true },
          { text: `${fanData.crossPoint?.[0]?.power || 'Н/Д'} кВт` }
        ],
        [
          { text: 'КПД', bold: true, fillColor: true },
          { text: `${fanData.crossPoint?.[0]?.kpd || 'Н/Д'} %` }
        ],
        [
          { text: 'Скорость вращения', bold: true, fillColor: true },
          { text: `${fanData.speed || 'Н/Д'} об/мин` }
        ],
        [
          { text: 'Количество', bold: true, fillColor: true },
          { text: `${fan.quantity || 1} шт.` }
        ]
      ]

      rtfContent += createTableRTF(technicalData) + '\\par\\par'

      // Примечание
      rtfContent += `\\b ${toUnicodeRTF('Примечание:')} \\b0 ${toUnicodeRTF(fanData.require.notice || 'Нет примечания')}\\par\\par`

      // СТРАНИЦА 2: График аэродинамической характеристики
      rtfContent += `\\page\\qc\\b\\fs32 ${toUnicodeRTF('АЭРОДИНАМИЧЕСКАЯ ХАРАКТЕРИСТИКА')}\\b0\\fs24\\par\\par`

      // Добавляем график если он есть
      if (fanData.graph?.graph?.base64) {
        try {
          const imageBuffer = base64ToArrayBuffer(fanData.graph.graph.base64)
          if (imageBuffer) {
            rtfContent += addImageToRTF(imageBuffer, 8000, 6000) + '\\par\\par'
          } else {
            rtfContent += `${toUnicodeRTF('Ошибка обработки изображения')}\\par`
          }
        } catch (error) {
          console.error('Ошибка добавления изображения:', error)
          rtfContent += `${toUnicodeRTF('График: ошибка обработки')}\\par`
        }
      } else {
        rtfContent += `${toUnicodeRTF('График не доступен')}\\par`
      }

      rtfContent += `\\qc\\i ${toUnicodeRTF(`Вентилятор: ${fanData['Модель колеса']}, скорость вращения: ${fanData.speed} об/мин`)}\\i0\\par\\par`

      // СТРАНИЦА 3: Габаритно-присоединительные размеры
      rtfContent += `\\page\\qc\\b\\fs32 ${toUnicodeRTF('ГАБАРИТНО-ПРИСОЕДИНИТЕЛЬНЫЕ РАЗМЕРЫ ВЕНТИЛЯТОРА')}\\b0\\fs24\\par\\par`

      // Добавляем чертеж вентилятора
      if (blueprintBuffer) {
        try {
          rtfContent += addImageToRTF(blueprintBuffer, 8000, 6000) + '\\par\\par'
          rtfContent += `\\qc\\i ${toUnicodeRTF('Пример чертежа - окончательный чертеж будет предоставлен после подтверждения заказа')}\\i0\\par\\par`
        } catch (error) {
          console.error('Ошибка добавления чертежа:', error)
          rtfContent += `${toUnicodeRTF('Чертеж: ошибка обработки')}\\par`
        }
      } else {
        rtfContent += `${toUnicodeRTF('Чертеж не доступен')}\\par`
      }

      // Информация о размерах в таблице
      const dimensionsData = [
        [
          { text: 'Габаритные размеры', bold: true, fillColor: true },
          { text: 'Будут указаны в рабочих чертежах' }
        ],
        [
          { text: 'Присоединительные размеры', bold: true, fillColor: true },
          { text: 'Согласно технической документации' }
        ],
        [
          { text: 'Масса', bold: true, fillColor: true },
          { text: fanData['Масса, кг'] ? `${fanData['Масса, кг']} кг` : 'Уточняется при заказе' }
        ],
        [
          { text: 'Способ монтажа', bold: true, fillColor: true },
          { text: 'Согласно проекту' }
        ],
        [
          { text: 'Диаметр вала', bold: true, fillColor: true },
          { text: fanData['Диаметр вала, мм'] ? `${fanData['Диаметр вала, мм']} мм` : 'Уточняется' }
        ],
        [
          { text: 'Присоединительные фланцы', bold: true, fillColor: true },
          { text: 'Стандартные' }
        ]
      ]

      rtfContent += createTableRTF(dimensionsData) + '\\par\\par'
    }

    // Завершаем RTF документ
    rtfContent += '}'

    // Создаем и скачиваем файл
    const blob = new Blob([rtfContent], { 
      type: 'application/rtf;charset=windows-1251' 
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ТКП_${proposal.title}_${new Date().toISOString().slice(0, 10)}.rtf`
    document.body.appendChild(link)
    link.click()
    
    // Очистка
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
    
  } catch (error) {
    console.error('Ошибка генерации RTF:', error)
  } finally {
    isGeneratingRTF.value = false
  }
}

const generatePDF = async () => {
  isGeneratingPDF.value = true
  
  try {
    const proposal = proposalsStore.currentProposal
    if (!proposal || !proposal.proposal_fans?.length) return

    // Загружаем изображения для хэдера, футера и чертежа
    const headerBase64 = await loadImageAsBase64(headerImage)
    const footerBase64 = await loadImageAsBase64(footerImage)
    const blueprintBase64 = await loadImageAsBase64(blueprintImage)

    // Высота хэдера и футера в points (примерно)
    const headerHeight = 80
    const footerHeight = 60

    // Хэдер для каждой страницы (колонтитул)
    const header = (currentPage, pageCount) => {
      return {
        image: headerBase64,
        width: 595, // Ширина A4 в points
        alignment: 'center',
        margin: [0, 0, 0, 0] // Отступ сверху
      }
    }

    // Футер для каждой страницы (колонтитул)
    const footer = (currentPage, pageCount) => {
      return {
        stack: [
          {
            image: footerBase64,
            width: 595,
            alignment: 'center',
            margin: [0, 45, 0, 5]
          },
        ]
      }
    }

    const documentDefinition = {
      pageSize: 'A4',
      // Увеличиваем отступы для основного контента, чтобы не перекрывался колонтитулами
      pageMargins: [40, headerHeight + 40, 40, footerHeight + 40],
      header: header,
      footer: footer,
      styles: {
        sectionHeader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 10],
          color: '#1976d2',
          alignment: 'center'
        },
        fanHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
          color: '#2c3e50'
        },
        normalText: {
          fontSize: 12,
          margin: [0, 2, 0, 2]
        },
        noteText: {
          fontSize: 10,
          italics: true,
          color: '#666',
          margin: [0, 5, 0, 0]
        },
        imageCaption: {
          fontSize: 10,
          alignment: 'center',
          margin: [0, 5, 0, 15],
          color: '#666'
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 12
      }
    }

    // Создаем контент документа
    documentDefinition.content = []

    // Для каждого вентилятора добавляем полный набор блоков
    proposal.proposal_fans.forEach((fan, index) => {
      const fanData = fan.fan_data
      const require = fanData.require || {}

      // СТРАНИЦА 1: Основные данные вентилятора
      documentDefinition.content.push(
        {
          text: `ВЕНТИЛЯТОР ${index + 1}: ${fanData['Модель колеса'] || 'Неизвестная модель'}`,
          style: 'sectionHeader',
          pageBreak: index > 0 ? 'before' : undefined,
          margin: [0, 20, 0, 15]
        },
        {
          text: 'ЗАДАННЫЕ ЗНАЧЕНИЯ',
          style: 'fanHeader',
          margin: [0, 10, 0, 10]
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Производительность (задано)', bold: true, fillColor: '#f5f5f5' },
                { text: `${require.requiredFlow || 'Н/Д'} м³/ч` }
              ],
              [
                { text: 'Давление (задано)', bold: true, fillColor: '#f5f5f5' },
                { text: `${require.requiredPressure || 'Н/Д'} Па` }
              ],
              [
                { text: 'Исполнение', bold: true, fillColor: '#f5f5f5' },
                { text: require.execution || 'Н/Д' }
              ],
              [
                { text: 'Температура перемещаемой среды', bold: true, fillColor: '#f5f5f5' },
                { text: `${require.temperature || 'Н/Д'} °C` }
              ],
              [
                { text: 'Тип двигателя', bold: true, fillColor: '#f5f5f5' },
                { text: require.typeOfMotor || 'Н/Д' }
              ],
              [
                { text: 'Резерв мощности', bold: true, fillColor: '#f5f5f5' },
                { text: `${require.powerReserve || 'Н/Д'} %` }
              ]
            ]
          },
          margin: [0, 0, 0, 15]
        },
        {
          text: 'ТЕХНИЧЕСКИЕ ДАННЫЕ ВЕНТИЛЯТОРА',
          style: 'fanHeader',
          margin: [0, 0, 0, 10]
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Название вентилятора', bold: true, fillColor: '#f5f5f5' },
                { text: fanData['Модель колеса'] || 'Н/Д' }
              ],
              [
                { text: 'Тип вентилятора', bold: true, fillColor: '#f5f5f5' },
                { text: fanData['Тип вентилятора'] || 'Н/Д' }
              ],
              [
                { text: 'Производительность фактическая', bold: true, fillColor: '#f5f5f5' },
                { text: `${fanData.crossPoint?.[0]?.x || 'Н/Д'} м³/ч` }
              ],
              [
                { text: 'Давление полное', bold: true, fillColor: '#f5f5f5' },
                { text: `${fanData.crossPoint?.[0]?.y || 'Н/Д'} Па` }
              ],
              [
                { text: 'Мощность', bold: true, fillColor: '#f5f5f5' },
                { text: `${fanData.crossPoint?.[0]?.power || 'Н/Д'} кВт` }
              ],
              [
                { text: 'КПД', bold: true, fillColor: '#f5f5f5' },
                { text: `${fanData.crossPoint?.[0]?.kpd || 'Н/Д'} %` }
              ],
              [
                { text: 'Скорость вращения', bold: true, fillColor: '#f5f5f5' },
                { text: `${fanData.speed || 'Н/Д'} об/мин` }
              ],
              [
                { text: 'Количество', bold: true, fillColor: '#f5f5f5' },
                { text: `${fan.quantity || 1} шт.` }
              ]
            ]
          },
          margin: [0, 0, 0, 10]
        },
        {
          text: `Примечание: ${require.notice || 'Нет примечания'}`,
          style: 'noteText',
          margin: [0, 0, 0, 15]
        }
      )

      // СТРАНИЦА 2: График аэродинамической характеристики
      documentDefinition.content.push(
        {
          text: 'АЭРОДИНАМИЧЕСКАЯ ХАРАКТЕРИСТИКА',
          style: 'sectionHeader',
          pageBreak: 'before',
          margin: [0, 20, 0, 15]
        }
      )

      // Добавляем график если он есть
      if (fanData.graph?.graph?.base64) {
        documentDefinition.content.push(
     {
      image: fanData.graph.graph.base64,
      width: 400,
      alignment: 'center',
      margin: [0, 20, 0, 10]
    },
          {
            text: `Вентилятор: ${fanData['Модель колеса']}, скорость вращения: ${fanData.speed} об/мин`,
            style: 'imageCaption',
            margin: [0, 0, 0, 20]
          }
        )
      } else {
        documentDefinition.content.push(
          {
            text: 'График не доступен',
            style: 'noteText',
            margin: [0, 0, 0, 15]
          }
        )
      }

      // СТРАНИЦА 3: Габаритно-присоединительные размеры
      documentDefinition.content.push(
        {
          text: 'ГАБАРИТНО-ПРИСОЕДИНИТЕЛЬНЫЕ РАЗМЕРЫ ВЕНТИЛЯТОРА',
          style: 'sectionHeader',
          pageBreak: 'before',
          margin: [0, 20, 0, 15]
        }
      )

      // Добавляем чертеж вентилятора
      if (blueprintBase64) {
        documentDefinition.content.push(
          {
            image: blueprintBase64,
            width: 400,
            alignment: 'center',
            margin: [0, 10, 0, 10]
          },
          {
            text: 'Пример чертежа - окончательный чертеж будет предоставлен после подтверждения заказа',
            style: 'noteText',
            alignment: 'center',
            margin: [0, 5, 0, 15]
          }
        )
      } else {
        documentDefinition.content.push(
          {
            text: 'Чертеж не доступен',
            style: 'noteText',
            margin: [0, 0, 0, 15]
          }
        )
      }

      // Информация о размерах
      documentDefinition.content.push(
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Габаритные размеры', bold: true, fillColor: '#f5f5f5' },
                { text: 'Будут указаны в рабочих чертежах' }
              ],
              [
                { text: 'Присоединительные размеры', bold: true, fillColor: '#f5f5f5' },
                { text: 'Согласно технической документации' }
              ],
              [
                { text: 'Масса', bold: true, fillColor: '#f5f5f5' },
                { text: fanData['Масса, кг'] ? `${fanData['Масса, кг']} кг` : 'Уточняется при заказе' }
              ],
              [
                { text: 'Способ монтажа', bold: true, fillColor: '#f5f5f5' },
                { text: 'Согласно проекту' }
              ],
              [
                { text: 'Диаметр вала', bold: true, fillColor: '#f5f5f5' },
                { text: fanData['Диаметр вала, мм'] ? `${fanData['Диаметр вала, мм']} мм` : 'Уточняется' }
              ],
              [
                { text: 'Присоединительные фланцы', bold: true, fillColor: '#f5f5f5' },
                { text: 'Стандартные' }
              ]
            ]
          },
          margin: [0, 0, 0, 20]
        }
      )
    })

    // Генерируем и скачиваем PDF
    pdfMake.createPdf(documentDefinition).download(`ТКП_${proposal.title}_${new Date().toISOString().slice(0, 10)}.pdf`)
    
  } catch (error) {
    console.error('Ошибка генерации PDF:', error)
  } finally {
    isGeneratingPDF.value = false
  }
}

const calculateTotal = () => {
  if (!proposalsStore.currentProposal?.proposal_fans) return 0
  
  return proposalsStore.currentProposal.proposal_fans.reduce((total, fan) => {
    return total + (fan.fan_data.price * fan.quantity)
  }, 0)
}
</script>

<style scoped>
.parameters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.parameter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.parameter-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}

.parameter-value {
  font-weight: 600;
  color: #1976d2;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
  min-height: 300px;
}
</style>