'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Info } from 'lucide-react';

export function InterviewSetupDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        jobTitle: '',
        jobDescription: '',
        interviewMode: 'professional',
        experienceLevel: 'mid',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const queryParams = new URLSearchParams({
            jobTitle: formData.jobTitle,
            jobDescription: formData.jobDescription,
            interviewMode: formData.interviewMode,
            experienceLevel: formData.experienceLevel,
        });
        setOpen(false);
        router.push(`/interviews/custom?${queryParams.toString()}`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="relative group cursor-pointer h-full min-h-[300px] w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-75 group-hover:opacity-100" />
                    <div className="relative h-full flex flex-col items-center justify-center p-6 bg-card border-2 border-dashed border-primary/30 rounded-xl hover:border-primary hover:bg-accent/5 transition-all duration-300 gap-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <PlusCircle className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-xl tracking-tight">Custom Interview</h3>
                            <p className="text-sm text-muted-foreground">Tailor the role, difficulty, and tone to your exact needs</p>
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Setup Custom Interview</DialogTitle>
                        <DialogDescription>
                            Configure your mock interview session. The AI will adapt to your choices.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="jobTitle">Job Role / Title</Label>
                            <Input
                                id="jobTitle"
                                placeholder="e.g. Senior React Developer"
                                value={formData.jobTitle}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="experienceLevel">Experience Level</Label>
                                <Select
                                    value={formData.experienceLevel}
                                    onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                                        <SelectItem value="mid">Mid-Level (2-5 years)</SelectItem>
                                        <SelectItem value="senior">Senior (5+ years)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="interviewMode">Interview Mode</Label>
                                <Select
                                    value={formData.interviewMode}
                                    onValueChange={(value) => setFormData({ ...formData, interviewMode: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="friendly">Friendly (Casual)</SelectItem>
                                        <SelectItem value="professional">Professional (Standard)</SelectItem>
                                        <SelectItem value="technical">Technical Focus</SelectItem>
                                        <SelectItem value="behavioral">Behavioral Focus</SelectItem>
                                        <SelectItem value="stress">Stress Test (Hard)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    Paste from LinkedIn/Indeed
                                </div>
                            </div>
                            <Textarea
                                id="jobDescription"
                                placeholder="Paste key requirements or responsibilities here..."
                                value={formData.jobDescription}
                                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit">Start Interview</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
