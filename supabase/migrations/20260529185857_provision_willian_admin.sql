DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if the user already exists to ensure idempotency
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'willian.santos1990@gmail.com') THEN
    new_user_id := gen_random_uuid();
    
    -- Insert the new user into auth.users
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token,
      last_sign_in_at
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'willian.santos1990@gmail.com',
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Willian Santos"}',
      false, 'authenticated', 'authenticated',
      '',    -- confirmation_token
      '',    -- recovery_token
      '',    -- email_change_token_new
      '',    -- email_change
      '',    -- email_change_token_current
      NULL,  -- phone MUST be NULL
      '',    -- phone_change
      '',    -- phone_change_token
      '',    -- reauthentication_token
      NOW()  -- last_sign_in_at
    );

    -- Insert corresponding record into public.profiles
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (new_user_id, 'Willian Santos', 'willian.santos1990@gmail.com', 'admin')
    ON CONFLICT (id) DO NOTHING;

    -- Ensure the role is correctly set to admin in case a trigger created the profile before the explicit insert
    UPDATE public.profiles 
    SET role = 'admin', full_name = 'Willian Santos'
    WHERE id = new_user_id;
  END IF;
END $$;
