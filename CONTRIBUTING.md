# Contributing to OpenPDF

First off, thank you for considering contributing to OpenPDF. It's people like you that make OpenPDF such a great tool.

## 1. Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](../../issues) section to see if someone else in the community has already created a ticket. If not, go ahead and make one!

## 2. Fork & create a branch

If this is something you think you can fix, then fork OpenPDF and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-watermark-feature
```

## 3. Implementation Guidelines

### Backend (Python)
- Follow **PEP 8** style guidelines.
- Add type hints to all functions and classes.
- Ensure all business logic is decoupled from the API layer.
- Run tests and ensure existing document processing works successfully.

### Frontend (React/Next.js)
- Use function components and hooks.
- Follow the existing Tailwind CSS utility-first approach.
- Ensure the state is managed via Zustand where global access is required.

## 4. Open a Pull Request

At this point, you should switch back to your master branch, pull, and then merge your new branch:

```sh
git commit -m "feat: Add watermark feature"
git push origin 325-add-watermark-feature
```

Finally, go to GitHub and open a Pull Request. Please use our provided template for your Pull Request description.
