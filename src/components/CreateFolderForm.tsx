
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { appConfig } from '@/config/appConfig';
import { getAccessTokenByApp } from '@/hooks/useClientCredentialsAuth';
import { Label } from "@/components/ui/label";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from '@/hooks/use-toast';
import { sharePointService } from '../services/sharePointService';
import { useAuth } from '../context/AuthContext';

interface CreateFolderFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

interface CreateFolderFormData {
    FolderName: string;
}

export const CreateFolderForm: React.FC<CreateFolderFormProps> = ({ onSuccess, onCancel }) => {
    const { getAccessToken } = useAuth();
    const [isCreating, setIsCreating] = useState(false);

    const form = useForm<CreateFolderFormData>({
        defaultValues: {
            FolderName: '',
        },
    });

    const onSubmit = async (data: CreateFolderFormData) => {
        try {
            setIsCreating(true);

            const token = await getAccessTokenByApp()
            //getAccessToken();
            if (!token) {
                toast({
                    title: "Create folder authentication error",
                    variant: "destructive",
                });
                return;
            }
            const newFolder = await sharePointService.createFolder(token, appConfig.ContainerID, "", data.FolderName,);

            toast({
                title: `Folder "${data.FolderName}" creation success`,
            });

            form.reset();

            // Pass the new folder ID to the parent component
            onSuccess();
        } catch (error: any) {
            toast({
                title: "Create folder error",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="FolderName"
                    rules={{ required: "Folder name is required" }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Folder Name *</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter Folder name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />



                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Folder'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

