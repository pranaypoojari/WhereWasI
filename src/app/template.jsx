// A template re-mounts on every navigation, so this wrapper gives each route a short
// fade/slide-in. Pure CSS (see .page-transition in globals.css) and disabled for reduced motion.
export default function Template({ children }) {
  return <div className="page-transition">{children}</div>;
}
