import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  FileText,
  Link2,
  ClipboardCheck,
  Wand2,
  ArrowRight,
} from "lucide-react";

const Home = () => {
  return (
    <PageShell>
      <section className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary tracking-wide">
            TalentEdge-AI
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground">
          Build a resume that{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            matches the job
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose your starting point. Turn messy thoughts into a clean resume or
          tailor an existing resume to a LinkedIn job post in minutes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button
            asChild
            size="lg"
            className="h-12 text-base font-semibold bg-gradient-primary hover:opacity-90"
          >
            <Link to="/from-thoughts">
              Start from Thoughts <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 text-base font-semibold border-border hover:bg-secondary/20"
          >
            <Link to="/from-job-description">Tailor to Job Post</Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border bg-card hover:border-primary/30 transition-smooth">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Resume from Thoughts
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Paste raw notes about your experience and projects. The AI organizes
            them into a polished, ATS-ready resume.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            Works best for fresh drafts and career switches.
          </div>
          <Button
            asChild
            variant="secondary"
            className="w-full h-11 text-sm font-semibold"
          >
            <Link to="/from-thoughts">Try Resume from Thoughts</Link>
          </Button>
        </Card>

        <Card className="p-6 border bg-card hover:border-primary/30 transition-smooth">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Resume from Job Description
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your existing resume, paste a LinkedIn job URL, and get a
            tailored version aligned with the role requirements.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Wand2 className="w-4 h-4 text-secondary" />
            Best for targeted applications and job matching.
          </div>
          <Button
            asChild
            variant="secondary"
            className="w-full h-11 text-sm font-semibold"
          >
            <Link to="/from-job-description">Tailor My Resume</Link>
          </Button>
        </Card>
      </section>

      <section className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="p-6 text-center border bg-card hover:border-primary/30 transition-smooth">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold mb-2 text-foreground text-lg">
            AI-Powered
          </h3>
          <p className="text-sm text-muted-foreground">
            Transform messy inputs into crisp, recruiter-ready content.
          </p>
        </Card>
        <Card className="p-6 text-center border bg-card hover:border-secondary/30 transition-smooth">
          <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-7 h-7 text-secondary" />
          </div>
          <h3 className="font-semibold mb-2 text-foreground text-lg">
            ATS-Friendly
          </h3>
          <p className="text-sm text-muted-foreground">
            Structured for parsing systems and human reviewers alike.
          </p>
        </Card>
        <Card className="p-6 text-center border bg-card hover:border-primary/30 transition-smooth">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold mb-2 text-foreground text-lg">
            Instant Export
          </h3>
          <p className="text-sm text-muted-foreground">
            Download as PDF, DOCX, or TXT in a single click.
          </p>
        </Card>
      </section>
    </PageShell>
  );
};

export default Home;
