<template>
  <v-container class="pa-3 ma-3" fluid>
    <v-card class="pa-2">
      <v-card-title class="text-h6 mb-6">Новое техническое предложение</v-card-title>
      
      <v-form @submit.prevent="handleSubmit">
        <v-text-field
          v-model="form.title"
          label="Название предложения*"
          required
          :rules="[v => !!v || 'Обязательное поле']"
        ></v-text-field>
        
        <v-textarea
          v-model="form.description"
          label="Описание"
          rows="1"
        ></v-textarea>
        
        <v-card class="mt-1 pa-2" elevation="2">
          <v-card-title class="text-h6">Подбор вентиляторов</v-card-title>
          
          <v-divider class="my-4"></v-divider>
          
          <!-- Трехколоночный интерфейс подбора -->
          <v-row>
            <!-- Колонка 1: Параметры подбора -->
            <v-col cols="4" >
              <v-card variant="outlined">
                <v-card-title class="text-h6">Параметры подбора</v-card-title>
                <v-card-text>
                  <v-row no-gutters >
                    <v-col cols="6"  >
                      <v-text-field  
                        v-model="searchParams.system"
                        label="Система"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.quantity"
                        label="Количество"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  
                  <v-row no-gutters>
                    <v-col cols="6">
                      <v-select
                        v-model="searchParams.type"
                        :items="['Радиальный', 'Осевой', 'Крышный вверх', 'Крышный в стороны', 'Канальный круглый', 'Канальный прямоугольный', 'Канальный с колесом свободного вращения', 'Пылевой', 'Свободное колесо', 'Крышный осевой', 'Тягодутьевая машина']"
                        label="Тип"
                        required
                        @update:modelValue="updateSeriesOptions"
                      ></v-select>
                    </v-col>
                    <v-col cols="6">
                      <v-select
                        v-model="searchParams.series"
                        :items="seriesOptions"
                        label="Серия"
                        :disabled="!searchParams.type"
                        required
                      ></v-select>
                    </v-col>
                  </v-row>
                  
                  <!-- Остальные параметры -->
                  <v-row no-gutters>
                    <v-col cols="6">
                      <v-select
                        v-model="searchParams.execution"
                        :items="['Общепромышленный', 'Коррозионностойкий', 'Кислотостойкий', 'Взрывозащищенный категории IIВ', 'Взрывозащищенный категории IIВ и коррозионностойкий', 'Взрывозащищенный категории IIВ и кислотостойкий', 'Взрывозащищенный категории IIС', 'Взрывозащищенный категории IIС и коррозионностойкий', 'Взрывозащищенный категории IIС и кислотостойкий', 'Теплостойкий', 'Коррозионностойкий и теплостойкий', 'Дымоудаление 400', 'Дымоудаление 600', 'Дымоудаление 600 взрывозащищенный категории IIВ', 'Взрывозащищенный из алюминиевых сплавов']"
                        label="Исполнение"
                      ></v-select>
                    </v-col>
                    <v-col cols="6">
                      <v-select
                        v-model="searchParams.climate"
                        :items="['У1', 'У2', 'У3', 'УХЛ1', 'УХЛ2', 'УХЛ3', 'Т1', 'Т2', 'ОМ2']"
                        label="Климат. исполнение"
                      ></v-select>
                    </v-col>
                  </v-row>
                  
                  <v-row no-gutters>
                    <v-col cols="6">
                      <v-select
                        v-model="searchParams.position"
                        :items="['0', '45', '90', '135', '180', '225', '270', '315']"
                        label="Положение корпуса"
                      ></v-select>
                    </v-col>
                    <v-col cols="6">
                      <v-select
                        v-model="searchParams.rotation"
                        :items="['Правое', 'Левое']"
                        label="Направление вращения"
                      ></v-select>
                    </v-col>
                  </v-row>
                  
                  <v-row no-gutters>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.requiredFlow"
                        label="Требуемый расход (м³/ч)"
                        type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.requiredPressure"
                        label="Требуемое давление (Па)"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row no-gutters>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.fluctuationPercentUp"
                        label="Возможное отклонение вверх, %"
                        type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.fluctuationPercentDown"
                        label="Возможное отклонение вниз, %"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row no-gutters>
                    <v-col cols="6">
                      <v-select
                        v-model="searchParams.typeOfMotor"
                        label="Тип двигателя"
                        :items="['Не важно', '1 ф, 220 В', '3 ф, 220/380 В', '3 ф, 380 В', '3 ф, 380/660 В']"
                      ></v-select>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.powerReserve"
                        label="Резерв мощности, %"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row no-gutters>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.temperature"
                        label="Температура, °C"
                        type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.height"
                        label="Высота над уровнем моря, м"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row no-gutters>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.minFreq"
                        label="Минимальная частота, Гц"
                        type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="searchParams.maxFreq"
                        label="Максимальная частота, Гц"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-row no-gutters>
                    <v-col cols="4">
                      <v-select
                        v-model="searchParams.calcType"
                        label="Тип расчета"
                        :items="['По умолчанию', 'Полный', 'Статический']"
                      ></v-select>
                    </v-col>
                    <v-col cols="4">
                      <v-select
                        v-model="searchParams.startType"
                        label="Тип запуска"
                        :items="['Прямой пуск', 'Частотный преобразователь', 'Плавный пуск']"
                      ></v-select>
                    </v-col>
                    <v-col cols="4">
                      <v-checkbox 
                        v-model="searchParams.five"
                        label="Исполнение 5"
                      ></v-checkbox >
                    </v-col>
                  </v-row>

                  <v-row no-gutters>
                    <v-col cols="12">
                      <v-text-field
                        v-model="searchParams.notice"
                        label="Примечание"
                        type="text"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  
                  <v-btn
                    color="primary"
                    block
                    class="mt-4"
                    @click="searchFans"
                    :loading="isSearching"
                  >
                    Подобрать вентиляторы
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
            
            <!-- Колонка 2: Подобранные вентиляторы -->
            <v-col cols="3">
              <v-card variant="outlined">
                <v-card-title class="text-h6">Подобранные вентиляторы</v-card-title>
                <v-card-text>
                  <v-list v-if="searchResults.length > 0">
                    <v-list-item
                      v-for="fan in searchResults"
                      :key="fan.id"
                      @click="selectFan(fan)"
                      :class="{ 'selected-fan': selectedFan?.id === fan.id }"
                    >
                      <template v-slot:prepend>
                        <v-icon icon="mdi-fan"></v-icon>
                      </template>
                      
                      <v-list-item-title>{{ fan['Модель колеса'] }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ fan['Тип вентилятора'] }}
                      </v-list-item-subtitle>
                      
                    </v-list-item>
                  </v-list>
                  
                  <v-alert
                    v-else-if="hasSearched"
                    type="info"
                  >
                    Вентиляторы не найдены. Измените параметры поиска.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>
            
            <!-- Колонка 3: Технические данные выбранного вентилятора -->
            <v-col cols="5">
              <v-card variant="outlined">
                <v-card-title class="text-h6">Технические данные</v-card-title>
                <v-card-text>
                  <div v-if="selectedFan">
                    <v-list>
                      <v-list-item>
                        <v-list-item-title class="text-h6">
                          {{ selectedFan["Модель колеса"]  }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          {{ selectedFan["Модель колеса"] }}
                        </v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-divider class="my-2"></v-divider>
                      
                      <v-list-item>
                        <v-list-item-title>Основные параметры:</v-list-item-title>
                          <div>Фактический расход: {{ selectedFan.crossPoint[0].x}} м³/ч</div>
                          <div>Фактическое давление: {{ selectedFan.crossPoint[0].y }} Па</div>
                          <div>Мощность: {{ selectedFan.crossPoint[0].power }} кВт</div>
                          <div>КПД: {{ selectedFan.crossPoint[0].kpd }} %</div>
                          <div>Скорость вращения: {{ selectedFan.speed }} об/мин</div>
                      </v-list-item>

                      <!-- Блок дополнительных опций -->
                      <v-list-item>
                        <v-list-item-title>Дополнительные опции:</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-checkbox
                            v-model="selectedFan.additionalOptions.flexibleInserts"
                            label="Гибкие вставки"
                            density="compact"
                          ></v-checkbox>
                          <v-checkbox
                            v-model="selectedFan.additionalOptions.responseFlanges"
                            label="Ответные фланцы"
                            density="compact"
                          ></v-checkbox>
                          <v-checkbox
                            v-model="selectedFan.additionalOptions.vibrationIsolators"
                            label="Виброизоляторы"
                            density="compact"
                          ></v-checkbox>
                          <v-text-field
                            v-model="selectedFan.additionalOptions.customOption"
                            label="Другая опция"
                            placeholder="Укажите дополнительную опцию"
                            density="compact"
                            class="mt-2"
                          ></v-text-field>
                        </v-list-item-subtitle>
                      </v-list-item>
                      
                      <!-- График -->
                      <v-list-item>
                        <v-card class="mt-4" flat>
                          <v-card-title class="text-subtitle-1">
                            Аэродинамическая характеристика
                          </v-card-title>
                          <v-card-text>
                            <div class="chart-placeholder">
                              <div>График рабочей точки</div>
                              <img ref="image" >
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Примечание:</v-list-item-title>
                        <v-list-item-subtitle>
                          <div>{{ selectedFan.require.notice}}</div>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                    
                    <v-btn
                      color="primary"
                      block
                      class="mt-4"
                      @click="addSelectedFan"
                      :disabled="!selectedFan"
                    >
                      Добавить в предложение
                    </v-btn>
                  </div>
                  
                  <v-alert
                    v-else
                    type="info"
                  >
                    Выберите вентилятор для просмотра характеристик
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- Список выбранных вентиляторов -->
          <v-card class="mt-4" variant="outlined">
            <v-card-title class="text-h6">Выбранные вентиляторы</v-card-title>
            <v-card-text>
              <v-alert
                v-if="selectedFans.length === 0"
                type="info"
              >
                Нет выбранных вентиляторов
              </v-alert>
              
              <v-table v-else>
                <thead>
                  <tr>
                    <th>Модель</th>
                    <th>Расход (м³/ч)</th>
                    <th>Давление (Па)</th>
                    <th>Доп. опции</th>
                    <th>Кол-во</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(fan, index) in selectedFans" :key="index">
                    <td>{{ fan['Модель колеса'] }}</td>
                    <td>{{ fan.crossPoint[0].x }}</td>
                    <td>{{ fan.crossPoint[0].y }}</td>
                    <td>
                      <div class="additional-options">
                        <v-chip 
                          v-if="fan.additionalOptions?.flexibleInserts" 
                          size="small" 
                          color="primary" 
                          class="mr-1 mb-1"
                        >
                          Гибкие вставки
                        </v-chip>
                        <v-chip 
                          v-if="fan.additionalOptions?.responseFlanges" 
                          size="small" 
                          color="primary" 
                          class="mr-1 mb-1"
                        >
                          Ответные фланцы
                        </v-chip>
                        <v-chip 
                          v-if="fan.additionalOptions?.vibrationIsolators" 
                          size="small" 
                          color="primary" 
                          class="mr-1 mb-1"
                        >
                          Виброизоляторы
                        </v-chip>
                        <v-chip 
                          v-if="fan.additionalOptions?.customOption" 
                          size="small" 
                          color="secondary" 
                          class="mr-1 mb-1"
                        >
                          {{ fan.additionalOptions.customOption }}
                        </v-chip>
                        <span v-if="!hasAdditionalOptions(fan)">-</span>
                      </div>
                    </td>
                    <td>
                      <v-text-field
                        v-model.number="fan.quantity"
                        type="number"
                        min="1"
                        density="compact"
                        style="max-width: 80px;"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        color="error"
                        size="small"
                        @click="removeFan(index)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-card>
        
        <v-card-actions class="mt-6">
          <v-btn
            to="/proposals"
            variant="text"
            color="grey"
          >
            Отмена
          </v-btn>
          
          <v-spacer></v-spacer>
          
          <v-btn
            type="submit"
            color="primary"
            :loading="proposalsStore.isLoading"
            :disabled="selectedFans.length === 0"
          >
            Сохранить предложение
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useProposalsStore } from '@/stores/proposals'
import { useRouter } from 'vue-router'

const form = ref({
  title: '',
  description: ''
})

const typeSeriesMap = {
  'Радиальный': ['Все', 'ВР 80-75', 'ВР 280-46', 'ВР 132-30', 'ВР 140-15','ВР 12-26','ВЦ 6-20','ВЦ 5','ВРм ДУ','ВР индустриальные','ВРз ДУ','ВРм'],
  'Осевой': ['Все', 'ВО-13-284', 'ВО 06-300', 'ВО 25-188','ВО 30-160','ВОЭ-5','ВО 21-12 подпор','ВО 21-12 общеобмен'],
  'Крышный вверх': ['Все', 'ВКРФ ДУ', 'ВКРФ-РВ', 'ВКРФ-РВ-ДУ под ЧРП','ВКРФм ДУ','ВКРФм','ВКРФ','ВКРФм-РВ-ДУ под ЧРП','ВМК-Ш','ВМК'],
  'Крышный в стороны': ['Все', 'ВКР', 'ВКРС-РВ'],
  'Канальный круглый': ['Все', 'ВКК'],
  'Канальный прямоугольный': ['Все', 'ВКП', 'ВКП-Б', 'ВКПН'],
  'Канальный с колесом свободного вращения': ['Все'],
  'Пылевой': ['Все', 'ВЦП 7-40'],
  'Свободное колесо': ['Все'],
  'Крышный осевой': ['Все', 'ВКОПв 21-12'],
  'Тягодутьевая машина': ['Все','ВДН/ДН','Д/ВД'],
}

const searchParams = ref({
  system: '',
  quantity: 1,
  type: 'Радиальный',
  series: '',
  execution: 'Общепромышленный',
  climate: 'У1',
  position: '0',
  rotation: 'Правое',
  requiredFlow: 3000,
  requiredPressure: 500,
  fluctuationPercentUp: 20,
  fluctuationPercentDown: 0,
  powerReserve:0,
  typeOfMotor:'Не важно',
  height:0,
  temperature:20,
  minFreq:30,
  maxFreq:50,
  calcType:'По умолчанию',
  startType:'Прямой пуск',
  five: false,
  notice:'',
})

const seriesOptions = computed(() => {
  return searchParams.value.type 
    ? typeSeriesMap[searchParams.value.type] || []
    : []
})

const image = ref(null);

const updateSeriesOptions = () => {
  searchParams.value.series = ''
}

// Инициализация дополнительных опций для вентиляторов
const initializeAdditionalOptions = (fan) => {
  if (!fan.additionalOptions) {
    fan.additionalOptions = {
      flexibleInserts: false,
      responseFlanges: false,
      vibrationIsolators: false,
      customOption: ''
    }
  }
  return fan
}

const selectedFans = ref([])
const searchResults = ref([])
const selectedFan = ref(null)
const isSearching = ref(false)
const hasSearched = ref(false)

const proposalsStore = useProposalsStore()
const router = useRouter()

const searchFans = async () => {
  isSearching.value = true
  hasSearched.value = true

  try {
    // Используем относительный путь для продакшена
    const apiUrl = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/api/fans/select`
      : '/api/fans/select'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        flow_rate: searchParams.value.requiredFlow,
        pressure: searchParams.value.requiredPressure,
        system: searchParams.value.system,       
        quantity: searchParams.value.quantity,
        type: searchParams.value.type,
        series: searchParams.value.series,
        execution: searchParams.value.execution,
        climate: searchParams.value.climate,
        position: searchParams.value.position,
        rotation: searchParams.value.rotation,
        fluctuationPercentUp: searchParams.value.fluctuationPercentUp,
        fluctuationPercentDown: searchParams.value.fluctuationPercentDown,
        powerReserve: searchParams.value.powerReserve,
        typeOfMotor: searchParams.value.typeOfMotor,
        temperature: searchParams.value.temperature,
        height: searchParams.value.height,
        minFreq: searchParams.value.minFreq,
        maxFreq: searchParams.value.maxFreq,
        calcType: searchParams.value.calcType,
        startType: searchParams.value.startType,
        five: searchParams.value.five,
        notice: searchParams.value.notice,
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Инициализируем дополнительные опции для каждого вентилятора
    searchResults.value = data.map(fan => initializeAdditionalOptions(fan))
    
    if (data.length > 0) {
      // selectedFan.value = data[0]
    }
  } catch (error) {
    console.error('Ошибка поиска:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// В функции selectFan обновите отображение графика
const selectFan = async (fan) => {
  selectedFan.value = initializeAdditionalOptions(fan)
  await nextTick()
  
  if (image.value) {
    if (fan.graph?.graph?.base64) {
      // Используем base64 для лучшей совместимости
      image.value.src = fan.graph.graph.base64;
    } else if (fan.graph?.graph?.url) {
      // Используем URL если base64 нет
      image.value.src = fan.graph.graph.url;
    } else {
      console.log('График не доступен');
    }
  }
}

const addSelectedFan = () => {
  if (!selectedFan.value) return
  
  const exists = selectedFans.value.some(f => f.ID === selectedFan.value.ID)
  if (!exists) {
    selectedFans.value.push({
      ...selectedFan.value,
      quantity: 1
    })
  }
}

const removeFan = (index) => {
  selectedFans.value.splice(index, 1)
}

// Проверка наличия дополнительных опций
const hasAdditionalOptions = (fan) => {
  const options = fan.additionalOptions
  return options?.flexibleInserts || 
         options?.responseFlanges || 
         options?.vibrationIsolators || 
         options?.customOption
}

const handleSubmit = async () => {
  if (selectedFans.value.length === 0) return

  try {
    await proposalsStore.createProposal({
      ...form.value,
      fans: selectedFans.value,
      parameters: searchParams.value
    })
    
    router.push('/proposals')
  } catch (error) {
    console.error('Ошибка сохранения:', error)
  }
}
</script>

<style scoped>
.selected-fan {
  background-color: rgba(25, 118, 210, 0.08);
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-height: 800px;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #666;
}

.additional-options {
  max-width: 200px;
}
</style>