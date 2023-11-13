import * as Dialog from '@radix-ui/react-dialog';
import cn from 'classnames';
import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikValues,
} from 'formik';
import { MessageSquare, X } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

import emitter, { EVENT_OPEN_PROMPT, EVENT_OPEN_CONTACT } from '@/lib/events';
import useSystemStatus from '@/lib/hooks/use-system-status';
import useUser from '@/lib/hooks/use-user';
import { isValidEmail } from '@/lib/utils';

import Button from '../ui/Button';
import { DocsPrompt } from '../ui/DocsPrompt';
import { ErrorLabel } from '../ui/Forms';
import { NoAutoInput } from '../ui/Input';
import { CTABar } from '../ui/SettingsCard';
import { SystemStatusButton } from '../ui/SystemStatusButton';
import TextArea from '../ui/TextArea';

export const ContactWindow = ({
  Component,
}: {
  closeOnClickOutside?: boolean;
  Component?: ReactNode;
}) => {
  const { user } = useUser();
  const { status } = useSystemStatus();
  const [isContactWindowOpen, setContactWindowOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setContactWindowOpen(true);
    };

    emitter.on(EVENT_OPEN_CONTACT, handler);

    return () => {
      emitter.off(EVENT_OPEN_CONTACT, handler);
    };
  }, []);

  return (
    <Dialog.Root
      open={isContactWindowOpen}
      onOpenChange={(open) => {
        setContactWindowOpen(open);
      }}
    >
      <Dialog.Trigger asChild>
        {Component ? (
          Component
        ) : (
          <div className="fixed right-6 bottom-6">
            <button
              className="transform rounded-full border border-neutral-800 bg-neutral-900 p-3 outline-none transition duration-300 hover:bg-neutral-1000"
              aria-label="Start chat"
            >
              <div className="relative">
                <X
                  className={cn(
                    'absolute inset-0 h-5 w-5 transform text-neutral-300 duration-300',
                    {
                      'opacity-0': !isContactWindowOpen,
                    },
                  )}
                />
                <MessageSquare
                  className={cn(
                    'h-5 w-5 transform text-neutral-300 duration-300',
                    {
                      'opacity-0': isContactWindowOpen,
                    },
                  )}
                />
              </div>
            </button>
          </div>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content className="animate-dialog-slide-in dialog-content max-h-[90%] w-[90%] max-w-[540px]">
          <Dialog.Title className="dialog-title flex flex-row items-center gap-4">
            <span className="flex-grow">Contact us</span>
            <div className="flex-none">
              <SystemStatusButton status={status} />
            </div>
          </Dialog.Title>
          <Dialog.Description className="dialog-description pb-4">
            Share feedback, request a feature, report a bug, or contact us.
          </Dialog.Description>
          <Formik
            initialValues={{
              email: '',
              message: '',
            }}
            validateOnMount
            validate={async (values) => {
              const errors: FormikErrors<FormikValues> = {};
              if (!user?.email) {
                if (!isValidEmail(values.email)) {
                  errors.email = 'Please enter a valid email address';
                }
              }
              if (!values.message) {
                errors.message = 'Please enter a message';
              }
              return errors;
            }}
            onSubmit={async (values, { setSubmitting }) => {
              setSubmitting(true);
              const email = user?.email || values.email;
              await fetch('/api/support/contact', {
                method: 'POST',
                body: JSON.stringify({ ...values, email }),
                headers: {
                  'Content-Type': 'application/json',
                  accept: 'application/json',
                },
              });
              setSubmitting(false);
              setContactWindowOpen(false);
              toast.success(
                'Thank you for your message! We will respond by email shortly.',
              );
            }}
          >
            {({ isSubmitting, isValid }) => (
              <Form>
                <div className="flex flex-col gap-1 border-t border-neutral-900 p-4">
                  {!user?.email && (
                    <>
                      <p className="mb-1 text-xs font-medium text-neutral-300">
                        What is your email?
                      </p>
                      <Field
                        className="max-w-[320px]"
                        type="email"
                        name="email"
                        inputSize="sm"
                        as={NoAutoInput}
                        disabled={isSubmitting}
                      />
                      <ErrorMessage name="email" component={ErrorLabel} />
                    </>
                  )}
                  <p
                    className={cn('mb-1 text-xs font-medium text-neutral-300', {
                      'mt-4': !user?.email,
                    })}
                  >
                    How can we help?
                  </p>
                  <Field
                    className="h-48"
                    type="text"
                    name="message"
                    textAreaSize="sm"
                    as={TextArea}
                    disabled={isSubmitting}
                  />
                  <ErrorMessage name="message" component={ErrorLabel} />
                </div>
                <CTABar>
                  <Dialog.Close asChild>
                    <Button variant="plain" buttonSize="sm">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    disabled={!isValid}
                    loading={isSubmitting}
                    variant="cta"
                    buttonSize="sm"
                    type="submit"
                  >
                    Send
                  </Button>
                </CTABar>
                <div className="flex flex-row items-center gap-4 border-t border-neutral-900 px-4 py-4">
                  <p className="mb-1 flex-grow text-xs text-neutral-300">
                    Want to skip the form and speak with an expert?
                  </p>
                  <Button
                    className="flex-none"
                    variant="cta"
                    buttonSize="sm"
                    type="submit"
                    href="https://meetings.hubspot.com/markprompt/demo"
                    target="_blank"
                  >
                    Book a demo
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export const MarkpromptPromptWindow = () => {
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setPromptOpen(true);
    };

    emitter.on(EVENT_OPEN_PROMPT, handler);

    return () => {
      emitter.off(EVENT_OPEN_PROMPT, handler);
    };
  }, []);

  return (
    <DocsPrompt onOpenChange={setPromptOpen}>
      <div
        className="fixed right-6 bottom-6"
        role="region"
        aria-label="Ask Markprompt"
      >
        <button
          className="transform rounded-full border border-neutral-800 bg-neutral-900 p-3 outline-none transition duration-300 hover:bg-neutral-1000"
          role="button"
          aria-label="Ask Markprompt"
        >
          <div className="relative" aria-hidden="true">
            <X
              className={cn(
                'absolute inset-0 h-5 w-5 transform text-neutral-300 duration-300',
                {
                  'opacity-0': !promptOpen,
                },
              )}
            />
            <MessageSquare
              className={cn('h-5 w-5 transform text-neutral-300 duration-300', {
                'opacity-0': promptOpen,
              })}
            />
          </div>
        </button>
      </div>
    </DocsPrompt>
  );
};
