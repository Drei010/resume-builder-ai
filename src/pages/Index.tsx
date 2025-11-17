import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, FileDown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

const Index = () => {
  const [jobInfo, setJobInfo] = useState("");
  const [resume, setResume] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!jobInfo.trim()) {
      toast.error("Please enter your job information");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-resume', {
        body: { jobInfo }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResume(data.resume);
      toast.success("Resume generated successfully!");
    } catch (error: any) {
      console.error('Error generating resume:', error);
      toast.error(error.message || "Failed to generate resume");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!resume) {
      toast.error("No resume to download");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Split resume into lines
      const lines = doc.splitTextToSize(resume, maxWidth);
      
      let y = margin;
      const lineHeight = 7;
      
      lines.forEach((line: string, index: number) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      doc.save("resume.pdf");
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Resume Builder</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground">
            Transform Your Job Info into a{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Professional Resume
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Paste your unorganized job details and let AI create an ATS-friendly Harvard format resume in seconds
          </p>
        </div>

        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 shadow-lg border-border/50 backdrop-blur-sm bg-card/80">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Job Information</h2>
            <Textarea
              placeholder="Paste or type your job details here...&#10;&#10;Example: I admined 16 repositories in GitHub. I supported 3 applications providing technical assistance..."
              value={jobInfo}
              onChange={(e) => setJobInfo(e.target.value)}
              className="min-h-[400px] resize-none text-base border-input focus:border-primary transition-smooth"
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !jobInfo.trim()}
              className="w-full mt-6 h-12 text-base font-medium shadow-md hover:shadow-lg transition-smooth bg-gradient-primary"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Resume...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Resume
                </>
              )}
            </Button>
          </Card>

          {/* Preview Section */}
          <Card className="p-6 shadow-lg border-border/50 backdrop-blur-sm bg-card/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Resume Preview</h2>
              {resume && (
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="gap-2 border-primary/20 hover:bg-primary/10 transition-smooth"
                >
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </div>
            <div className="min-h-[400px] bg-background/50 rounded-lg p-6 border border-border overflow-auto">
              {resume ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                  {resume}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Sparkles className="w-12 h-12 mx-auto opacity-20" />
                    <p>Your AI-generated resume will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="p-6 text-center shadow-md border-border/50 bg-card/80 hover:shadow-lg transition-smooth">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">Advanced AI transforms your raw data into polished content</p>
          </Card>
          <Card className="p-6 text-center shadow-md border-border/50 bg-card/80 hover:shadow-lg transition-smooth">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2 text-foreground">ATS-Friendly</h3>
            <p className="text-sm text-muted-foreground">Optimized to pass Applicant Tracking Systems</p>
          </Card>
          <Card className="p-6 text-center shadow-md border-border/50 bg-card/80 hover:shadow-lg transition-smooth">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileDown className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground">Instant Download</h3>
            <p className="text-sm text-muted-foreground">Export your resume as PDF with one click</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;