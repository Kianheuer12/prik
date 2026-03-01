import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { Colors } from "../../constants/colors";
import { PrikLogo } from "../../components/PrikLogo";

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert("Sign up failed", err.errors?.[0]?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      await setActive({ session: result.createdSessionId });
    } catch (err: any) {
      Alert.alert("Verification failed", err.errors?.[0]?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inner}>
          <View style={styles.logoContainer}><PrikLogo height={44} /></View>
          <Text style={styles.tagline}>Check your email for a code.</Text>
          <TextInput
            style={styles.input}
            placeholder="Verification code"
            placeholderTextColor={Colors.textMuted}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.logoContainer}><PrikLogo height={44} /></View>
        <Text style={styles.tagline}>Create your account.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Creating account..." : "Sign Up"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: {
    color: Colors.primary,
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
});
