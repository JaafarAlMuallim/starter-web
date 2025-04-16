"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

import { type ErrorContext } from "@better-fetch/fetch";
import LoadingButton from "@/components/loading-button";
import { signInSchema } from "@/validators";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

export default function SignIn() {
  const router = useRouter();
  const [pendingCredentials, setPendingCredentials] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleCredentialsSignIn = async (
    values: z.infer<typeof signInSchema>,
  ) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onRequest: () => {
          setPendingCredentials(true);
        },
        onSuccess: async () => {
          router.push("/");
        },
        onError: (ctx: ErrorContext) => {
          toast.error("Something went wrong", {
            description: ctx.error.message ?? "Something went wrong.",
          });
        },
      },
    );
    setPendingCredentials(false);
  };

  return (
    <div className="flex grow items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-gray-800">
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCredentialsSignIn)}
              className="space-y-6"
            >
              {["email", "password"].map((field) => (
                <FormField
                  control={form.control}
                  name={field as keyof z.infer<typeof signInSchema>}
                  key={field}
                  render={({ field: fieldProps }) => (
                    <FormItem>
                      <FormLabel>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type={field === "password" ? "password" : "email"}
                          placeholder={`Enter your ${field}`}
                          {...fieldProps}
                          autoComplete={
                            field === "password" ? "current-password" : "email"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <LoadingButton pending={pendingCredentials}>
                Sign in
              </LoadingButton>
            </form>
          </Form>
          {/*<div className="mt-4">
            <LoadingButton
              pending={pendingGithub}
              onClick={handleSignInWithGithub}
            >
              <Github className="w-4 h-4 mr-2" />
              Continue with GitHub
            </LoadingButton>
          </div>*/}
          <div className="mt-4 text-center text-sm"></div>
        </CardContent>
      </Card>
    </div>
  );
}
/*<Link
                href="/forgot-password"
                className="text-primary hover:underline"
            >
                Forgot password?
            </Link>*/
