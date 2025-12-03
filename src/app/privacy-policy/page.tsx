import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              <Shield className="size-8 text-primary" />
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Last updated: October 21, 2024</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none p-6 sm:p-8">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>Account information (name, email, password)</li>
              <li>Clinic information (name, address, contact details)</li>
              <li>Patient records and medical information</li>
              <li>Usage data and analytics</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Ensure HIPAA compliance and data security</li>
            </ul>

            <h2>3. HIPAA Compliance</h2>
            <p>
              DentaEdge is committed to maintaining compliance with the Health Insurance Portability and Accountability Act (HIPAA). We implement appropriate safeguards to protect patient health information (PHI).
            </p>

            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li>Encryption in transit (SSL/TLS)</li>
              <li>Encryption at rest</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Audit logging of all data access</li>
            </ul>

            <h2>5. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share information only:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>With service providers under strict confidentiality agreements</li>
            </ul>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. Medical records are retained according to applicable healthcare regulations.
            </p>

            <h2>8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information to improve user experience.
            </p>

            <h2>9. Third-Party Services</h2>
            <p>
              Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
            </p>

            <h2>10. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>

            <h2>11. Changes to Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@DentaEdge.com
            </p>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-center mb-0">
                Your privacy is important to us. We are committed to protecting your personal and patient information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

