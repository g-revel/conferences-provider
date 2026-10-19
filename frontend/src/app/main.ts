import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { FakeConferencesClient } from '../infrastructure/FakeConferencesClient.ts'
import { HttpConferencesClient } from '../infrastructure/HttpConferencesClient.ts'
import { FakeTalksClient } from '../infrastructure/FakeTalksClient.ts'
import { HttpTalksClient } from '../infrastructure/HttpTalksClient.ts'
import { HttpAdminClient } from '../infrastructure/HttpAdminClient.ts'
import { conferencesClientKey, talksClientKey, adminClientKey } from './injectionKeys'

const app = createApp(App)

const client = import.meta.env.DEV ? new FakeConferencesClient() : new HttpConferencesClient()
app.provide(conferencesClientKey, client)

const talksClient = import.meta.env.DEV ? new FakeTalksClient() : new HttpTalksClient()
app.provide(talksClientKey, talksClient)

// Pas de Fake pour l'admin : ces écrans n'ont de sens qu'avec un vrai backend
// (mutations persistées), contrairement au portail qui peut tourner sur des
// données figées en dev.
app.provide(adminClientKey, new HttpAdminClient())

app.mount('#app')
