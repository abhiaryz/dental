import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./email";

const prisma = new PrismaClient();

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(data: NotificationData) {
  try {
    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    // Check user preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: data.userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });

    // Send email if user has email notifications enabled
    if (preferences?.email && user?.email) {
      await sendEmailNotification({
        to: user.email,
        name: user.name || "User",
        title: data.title,
        message: data.message,
        link: data.link,
      });
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function sendEmailNotification({
  to,
  name,
  title,
  message,
  link,
}: {
  to: string;
  name: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
            <h3 style="color: #2563eb; margin-bottom: 15px;">${title}</h3>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${message}</p>
            ${link ? `
              <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
                View Details
              </a>
            ` : ''}
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This is an automated notification from MediCare. If you wish to stop receiving these emails, please update your notification preferences in settings.
            </p>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to,
      subject: title,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Error sending email notification:", error);
    // Don't throw - notification was created, email is optional
  }
}

// Helper function to send appointment reminders
export async function sendAppointmentReminder(appointmentId: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime = appointment.time;

    await createNotification({
      userId: appointment.patient.userId,
      type: "APPOINTMENT_REMINDER",
      title: "Appointment Reminder",
      message: `You have an appointment scheduled for ${formattedDate} at ${formattedTime}`,
      link: `/dashboard/appointments`,
      metadata: {
        appointmentId: appointment.id,
        date: appointment.date,
        time: appointment.time,
      },
    });
  } catch (error) {
    console.error("Error sending appointment reminder:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to send low stock alerts
export async function sendLowStockAlert(itemId: string) {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        clinic: {
          include: {
            users: {
              where: {
                role: { in: ["ADMIN", "CLINIC_DOCTOR"] },
              },
            },
          },
        },
      },
    });

    if (!item || !item.clinic) {
      return;
    }

    // Send notification to all admins and doctors
    for (const user of item.clinic.users) {
      await createNotification({
        userId: user.id,
        type: "INVENTORY_LOW_STOCK",
        title: "Low Stock Alert",
        message: `${item.name} is running low. Current stock: ${item.quantity} ${item.unit}. Minimum: ${item.minQuantity} ${item.unit}`,
        link: `/dashboard/inventory`,
        metadata: {
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
        },
      });
    }
  } catch (error) {
    console.error("Error sending low stock alert:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to send payment reminders
export async function sendPaymentReminder(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const dueDate = new Date(invoice.dueDate);
    const formattedDate = dueDate.toLocaleDateString();

    await createNotification({
      userId: invoice.patient.userId,
      type: "PAYMENT_REMINDER",
      title: "Payment Reminder",
      message: `Payment for invoice ${invoice.invoiceNumber} (₹${invoice.totalAmount}) is due on ${formattedDate}`,
      link: `/dashboard/finance`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        dueDate: invoice.dueDate,
      },
    });
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

