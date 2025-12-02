import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-cyan-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/signup">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="border-b bg-primary/5">
            <div className="flex items-center gap-3">
              <FileText className="size-8 text-primary" />
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Last updated: October 21, 2024</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none p-6 sm:p-8">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using MediCare ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use MediCare for personal or internal business purposes. This is the grant of a license, not a transfer of title.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            </p>

            <h2>4. HIPAA Compliance</h2>
            <p>
              MediCare is designed to assist healthcare providers in maintaining HIPAA compliance. Users are responsible for ensuring their use of the Service complies with all applicable healthcare regulations.
            </p>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect the security of your personal information and patient data.
            </p>

            <h2>6. Service Availability</h2>
            <p>
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to the Service.
            </p>

            <h2>7. User Obligations</h2>
            <p>You agree to:</p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not misuse or abuse the Service</li>
            </ul>

            <h2>8. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including violation of these Terms.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              MediCare shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the Service.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>

            <h2>11. Contact</h2>
            <p>
              For questions about these Terms, please contact us at support@medicare.com
            </p>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-center mb-0">
                By using MediCare, you acknowledge that you have read and understood these Terms of Service.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

