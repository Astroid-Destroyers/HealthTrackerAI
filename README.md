# [CLICK TO PREVIEW SITE](https://health-tracker-ai-sigma.vercel.app/)

# Next.js & HeroUI Template

This is a template for creating applications using Next.js 14 (pages directory) and HeroUI (v2).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/next-pages-template)

> Note: Since Next.js 14, the pages router is recommend migrating to the [new App Router](https://nextjs.org/docs/app) to leverage React's latest features
>
> Read more: [Pages Router](https://nextjs.org/docs/pages)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI](https://heroui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org)
- [Framer Motion](https://www.framer.com/motion)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/heroui-inc/next-pages-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## Email Configuration (Contact Form)

The contact form uses nodemailer to send emails. To set it up:

1. Copy `.env.example` to `.env.local`
2. Configure your SMTP settings:

```bash
# Email Configuration for Contact Form
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=support@healthtrackerai.com
```

### Gmail Setup
For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password as `SMTP_PASS`

### Other Email Providers
The configuration works with most SMTP providers. Update the `SMTP_HOST` and `SMTP_PORT` accordingly.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-pages-template/blob/main/LICENSE).
"# HealthTrackerAI" 
"# HealthTrackerAI"
