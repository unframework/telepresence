import React, { useEffect, useRef } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import {
  Formik,
  Form,
  FormikValues,
  useField,
  Field,
  FieldProps
} from 'formik';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';

export const BasicTextField: React.FC<{
  name: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  outlined?: boolean;
  autoFocus?: boolean;
}> = ({ name, label, placeholder, disabled, outlined, autoFocus }) => {
  const [field, meta] = useField({
    name,
    validate: (value) => {
      if (disabled) {
        return undefined;
      }

      if (value.trim() === '') {
        return 'Please fill in field';
      }

      return undefined;
    }
  });

  return (
    <TextField
      type="text"
      variant="outlined"
      autoComplete="off"
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      error={!!(meta.error && meta.touched)}
      helperText={meta.touched ? meta.error : undefined}
      inputProps={field}
      InputLabelProps={{
        shrink: true
      }}
      fullWidth
      margin="normal"
    />
  );
};

interface BasicFormProps<Values, Result> {
  initialValues: Values;
  actionLabel: string;
  action: (values: Values) => Promise<Result>;
  onComplete: (result: Result, values: Values) => void;
  children: React.ReactNode;
}

function BasicForm<Values extends FormikValues, Result>({
  initialValues,
  actionLabel,
  action,
  onComplete,
  children
}: BasicFormProps<Values, Result>) {
  const actionAsync = useAsyncCallback(async (values: Values) => {
    const result = await action(values);
    return { result, values };
  });

  // wrap in ref to avoid re-triggering effect
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // report success
  useEffect(() => {
    if (actionAsync.result && onCompleteRef.current) {
      const { result, values } = actionAsync.result;
      onCompleteRef.current(result, values);
    }
  }, [actionAsync.result]);

  return (
    <Formik<Values>
      initialValues={initialValues}
      onSubmit={(values, form) => {
        form.setSubmitting(false); // reset internal state
        actionAsync.execute(values);
      }}
    >
      {({ values }) => (
        <Form>
          <Box display="flex" flexDirection="column">
            {children}

            <Box
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              mt={2}
            >
              {actionAsync.loading && (
                <Box display="flex" flex="none" mr={1}>
                  <CircularProgress size={24} />
                </Box>
              )}

              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={!!(actionAsync.loading || actionAsync.result)}
              >
                {actionLabel}
              </Button>
            </Box>

            {actionAsync.error && (
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Typography variant="body2" color="error">
                  {actionAsync.error.message || 'Unknown error'}
                </Typography>
              </Box>
            )}
          </Box>
        </Form>
      )}
    </Formik>
  );
}

export default BasicForm;
