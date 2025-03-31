
import { useState, useEffect } from "react";
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

const SignIn = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already signed in, redirect to dashboard
    if (isSignedIn) {
      navigate("/dashboard");
      return;
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4">
        <Link 
          to="/" 
          className="inline-flex items-center text-foreground/80 hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="flex-grow flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-3xl font-bold mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Welcome to <span className="text-gradient">Sponofy</span>
            </motion.h1>
            <motion.p
              className="text-foreground/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Sign in to your account to continue
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="shadow-lg rounded-lg bg-white"
          >
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="opacity-100 transition-opacity duration-300">
                <ClerkSignIn signUpUrl="/sign-up" routing="path" path="/sign-in" />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;
