
import { interviews } from "@/lib/data";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InterviewSetupDialog } from "@/components/interview/interview-setup-dialog";

export default function InterviewsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Mock Interviews</h1>
      <p className="text-muted-foreground">
        Practice your interviewing skills with our AI-powered simulations.
      </p>
      <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
        <InterviewSetupDialog />
        {interviews.map((interview) => (
          <Card key={interview.id} className="flex flex-col overflow-hidden">
            <div className="relative h-48 w-full">
              <Image
                src={interview.image}
                alt={interview.title}
                fill
                style={{ objectFit: "cover" }}
                data-ai-hint={interview.imageHint}
              />
            </div>
            <CardHeader>
              <CardTitle>{interview.title}</CardTitle>
              <CardDescription>{interview.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button asChild className="w-full">
                <Link href={`/interviews/${interview.id}`}>
                  Start Interview <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
