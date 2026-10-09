import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { FakeConferencesClient } from '../infrastructure/FakeConferencesClient.ts'
import { HttpConferencesClient } from '../infrastructure/HttpConferencesClient.ts'
import { FakeTalksClient } from '../infrastructure/FakeTalksClient.ts'
import { HttpTalksClient } from '../infrastructure/HttpTalksClient.ts'
import { conferencesClientKey, talksClientKey } from './injectionKeys'

const app = createApp(App)

const client = import.meta.env.DEV ? new FakeConferencesClient() : new HttpConferencesClient()
app.provide(conferencesClientKey, client)

const talksClient = import.meta.env.DEV ? new FakeTalksClient() : new HttpTalksClient()
app.provide(talksClientKey, talksClient)

app.mount('#app')
