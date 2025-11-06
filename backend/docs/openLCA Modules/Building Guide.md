To use Eclipse RAP to build a web application version of the openLCA RCP application, you need to migrate your Eclipse RCP application codebase to target the RAP runtime and SWT/RWT APIs, enabling it to run in a browser environment with minimal changes.[1][2][3]

### Steps for Migrating openLCA RCP to RAP

- Eclipse RAP is built to allow code reuse between RCP and RAP, so much of your Java code (especially if it uses core Eclipse and SWT APIs) can run in both desktop and web contexts.[2][1]
- Set up your development environment with the Eclipse IDE for RCP and RAP Developers, which provides all necessary tooling for both plugin approaches.[4]
- Begin by creating a new RAP plug-in project, similar to starting an RCP project. Select the RAP Hello World template, then configure your application as a RAP target, deselecting RCP-specific options.[5]
- Substitute SWT widgets with RWT where necessary, as RWT is RAP's remote widget toolkit for rendering in browsers.[2]

### Specific Migration Points

- Many workbench components and core plugin architecture are shared. Ensure plugin dependencies reference RAP-compatible bundles, such as org.eclipse.rap.ui.workbench.[2]
- Most business logic, core models, and non-UI code from openLCA (via olca-modules) can be reused without modification, while UI code may need adaptation for browser compatibility.[6][7][2]
- HTML/JavaScript parts of openLCA's UI can be integrated into RAP using servlet resources and custom views, leveraging openLCA's existing olca-app-html subproject.[6]

### Additional Resources

- Tutorials and documentation on RAP and RCP migration are available from Eclipse and third-party developer blogs, guiding through specifics of plugin creation, servlet configuration, and workbench adaptation.[8][5][2]
- Community discussion boards and Stack Overflow often provide migration tips and answers to common problems in converting Eclipse RCP to RAP web applications.[3][9][10][8]

Most of openLCA's codebase, especially the backend logic via olca-modules, should integrate smoothly into a RAP project; the main effort is in porting desktop UI components to RAP's web web toolkit.

[1](https://eclipse.dev/rap/)
[2](https://angelozerr.wordpress.com/2011/05/24/rap_step5/)
[3](https://stackoverflow.com/questions/11504037/eclipse-rcp-for-the-web)
[4](https://www.eclipse.org/downloads/packages/release/2021-03/r/eclipse-ide-rcp-and-rap-developers)
[5](https://www.rcp-vision.com/sviluppare-applicazioni-web-con-eclipse-rap/?lang=en)
[6](https://github.com/GreenDelta/olca-app)
[7](https://ask.openlca.org/781/creating-plugins-in-openlca)
[8](https://eclipsesource.com/blogs/2011/06/20/using-osgi-services-to-single-source-an-rcp-and-rap-application/)
[9](https://www.eclipse.org/forums/index.php/t/1112264/)
[10](https://www.eclipse.org/forums/index.php/sf/thread/34/1/2400/)
[11](https://stackoverflow.com/questions/32532263/eclipse-rap-or-rwt-launch-configuration-accessing-web-inf-resources)
[12](https://teamdev.com/jxbrowser/docs/tutorials/eclipse/rcp-application/)
[13](https://www.eclipse.org/forums/index.php/t/672057/)
[14](https://www.openlca.org/wp-content/uploads/2025/01/The-format-converter_May2013.pdf)
[15](https://www.openlca.org)
[16](https://www.youtube.com/watch?v=O_aN3_s49tI)
[17](https://ask.openlca.org/4621/transfer-processes-computer-different-versions-databases)
[18](https://ask.openlca.org/4509/failed-to-create-the-parts-controls)
[19](https://www.reddit.com/r/eclipse/comments/1e1djf9/how_are_you_doing_gui_tests_for_eclipse_rcp/)
[20](https://ask.openlca.org/5131/convert-file)