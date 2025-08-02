// Script para crear tareas de ejemplo
const { MongoClient } = require("mongodb");

const sampleTasks = [
  {
    user_id: "user_123",
    assistant_id: "assistant_456",
    name: "Respuesta Automática de Soporte",
    description:
      "Responde automáticamente a emails de soporte con información básica",
    category: "email",
    prompt:
      "Cuando recibas un email de soporte, analiza el contenido y responde de manera profesional. Si es una consulta técnica, proporciona pasos básicos de solución. Si necesita atención humana, indica que será derivado al equipo correspondiente.",
    trigger: {
      type: "email_received",
      config: {
        emailConfig: {
          provider: "gmail",
          username: "soporte@miempresa.com",
          password: "app_password",
          useSSL: true,
          monitorFolder: "INBOX",
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          imapHost: "imap.gmail.com",
          imapPort: 993,
        },
        emailFilters: [
          {
            field: "to",
            operator: "contains",
            value: "soporte@miempresa.com",
          },
          {
            field: "subject",
            operator: "contains",
            value: "ayuda",
          },
        ],
        checkInterval: 5,
      },
    },
    conditions: [
      {
        field: "email_subject",
        operator: "contains",
        value: "ayuda",
      },
    ],
    actions: [
      {
        type: "email_reply",
        name: "Respuesta Automática",
        config: {
          emailSubject: "Re: {{original_subject}} - Respuesta Automática",
          emailBody: `Hola {{sender_name}},

Gracias por contactarnos. Hemos recibido tu consulta: "{{original_subject}}"

{{ai_analysis}}

Si necesitas ayuda adicional, nuestro equipo te contactará en las próximas 24 horas.

Saludos,
Equipo de Soporte Automatizado`,
        },
      },
      {
        type: "notification",
        name: "Notificar al Equipo",
        config: {
          notificationMessage:
            "Nuevo email de soporte recibido de {{sender_email}} - Asunto: {{original_subject}}",
        },
      },
    ],
    variables: {
      sender_name: "Cliente",
      sender_email: "cliente@ejemplo.com",
      original_subject: "Consulta de soporte",
      ai_analysis: "Análisis automático del contenido",
    },
    emailTemplates: [
      {
        name: "Plantilla de Soporte",
        subject: "Re: {{original_subject}} - Respuesta Automática",
        body: "Respuesta automática personalizada...",
        variables: ["sender_name", "original_subject", "ai_analysis"],
      },
    ],
    status: "active",
    runCount: 0,
  },
  {
    user_id: "user_123",
    assistant_id: "assistant_456",
    name: "Monitor de Servidor",
    description: "Monitorea el estado del servidor y envía alertas",
    category: "server",
    prompt:
      "Cuando detectes que el servidor está caído o presenta problemas, envía un email detallado al equipo de administración con información específica del problema y pasos que se están tomando.",
    trigger: {
      type: "api_monitor",
      config: {
        apiUrl: "https://mi-servidor.com/health",
        condition: "response_time > 5000 || status_code != 200",
      },
    },
    conditions: [
      {
        field: "response_time",
        operator: "greater_than",
        value: "5000",
      },
    ],
    actions: [
      {
        type: "email_send",
        name: "Enviar Alerta",
        config: {
          emailTo: "admin@miempresa.com,devops@miempresa.com",
          emailSubject:
            "🚨 ALERTA: Servidor {{server_name}} presenta problemas",
          emailBody: `ALERTA DE SERVIDOR

Servidor: {{server_name}}
URL: {{server_url}}
Tiempo de respuesta: {{response_time}}ms
Código de estado: {{status_code}}
Timestamp: {{timestamp}}

Acciones automáticas ejecutadas:
- Reinicio del servicio
- Verificación de logs
- Monitoreo continuo

Estado actual: {{current_status}}`,
        },
      },
      {
        type: "command",
        name: "Reiniciar Servicio",
        config: {
          command: "systemctl restart {{service_name}}",
        },
      },
    ],
    variables: {
      server_name: "Servidor Principal",
      server_url: "https://mi-servidor.com",
      service_name: "nginx",
      response_time: "0",
      status_code: "200",
      current_status: "Verificando...",
    },
    status: "active",
    runCount: 0,
  },
];

async function createSampleTasks() {
  const client = new MongoClient(
    process.env.DATABASE_URL || "mongodb://localhost:27017/your-database"
  );

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("automatedtasks");

    const result = await collection.insertMany(sampleTasks);
    console.log(`${result.insertedCount} sample tasks created successfully`);

    // También crear algunos logs de ejemplo
    const logsCollection = db.collection("tasklogs");
    const sampleLogs = sampleTasks.map((task) => ({
      taskId: task._id,
      eventType: "CREATED",
      message: `Task "${task.name}" created successfully`,
      timestamp: new Date(),
    }));

    await logsCollection.insertMany(sampleLogs);
    console.log(`${sampleLogs.length} sample logs created successfully`);
  } catch (error) {
    console.error("Error creating sample tasks:", error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  createSampleTasks();
}

module.exports = { createSampleTasks };
