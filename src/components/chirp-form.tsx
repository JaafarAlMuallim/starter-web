"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { chirpAction } from "@/app/actions";
import { api } from "@/trpc/react";
import { chirpSchema } from "@/validators";
import { toast } from "sonner";
import { Form, FormControl, FormField } from "./ui/form";
import { Textarea } from "./ui/textarea";
import LoadingButton from "./loading-button";

const ChirpForm = () => {
  const utils = api.useUtils();
  const form = useForm<z.infer<typeof chirpSchema>>({
    resolver: zodResolver(chirpSchema),
    defaultValues: {
      chirp: "",
    },
  });
  const onSubmit = async (data: z.infer<typeof chirpSchema>) => {
    chirpAction(data);
    form.reset();
    toast.success("Chirp Added Successfully");
    utils.chirp.getChirps.invalidate();
    utils.chirp.infinite.invalidate();
    utils.chirp.getUserChirps.invalidate();
    return;
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="chirp"
          render={({ field }) => (
            <FormControl>
              <Textarea
                placeholder="Write a chirp of your thoughts..."
                {...field}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }
                }}
                autoFocus
              />
            </FormControl>
          )}
        />
        <LoadingButton
          pending={form.formState.isSubmitting}
          className="self-end"
        >
          Submit
        </LoadingButton>
      </form>
    </Form>
  );
};

export default ChirpForm;
