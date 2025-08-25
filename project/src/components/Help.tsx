import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Book, MessageCircle, Shield, Mail, X } from 'lucide-react';

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    description: ''
  });

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    alert('Thank you for your message. We will get back to you soon!');
    setContactForm({
      name: '',
      email: '',
      subject: '',
      description: ''
    });
    setShowContactForm(false);
  };

  const faqs = [
    {
      question: 'What is Xlora?',
      answer: 'Xlora is an advanced proxy platform that routes your web traffic through secure servers, masking your IP address and encrypting your connection for complete privacy.',
      category: 'general',
    },
    {
      question: 'Is Xlora free to use?',
      answer: 'Yes, Xlora offers a free tier with basic features. Premium plans are available for users who need advanced features and higher bandwidth.',
      category: 'general',
    },
    {
      question: 'How does Xlora protect my privacy?',
      answer: 'Xlora maintains a strict zero-logs policy. Your browsing history, search queries, and personal data are never stored on our servers.',
      category: 'security',
    },
    {
      question: 'Can I access geo-restricted content?',
      answer: 'Yes, our global network of proxy servers allows you to access content from different regions while maintaining your privacy.',
      category: 'technical',
    },
    {
      question: 'How secure is the connection?',
      answer: 'We use military-grade encryption and advanced security protocols to ensure your connection is completely secure from any threats.',
      category: 'security',
    },
    {
      question: 'What about browser compatibility?',
      answer: 'Our platform works seamlessly with all modern browsers and devices, providing a consistent experience across all platforms.',
      category: 'technical',
    },
  ];

  const filteredFaqs = activeCategory
    ? faqs.filter(faq => faq.category === activeCategory)
    : faqs;
    
  const helpCategories = [
    {
      icon: Book,
      title: 'General',
      description: 'Learn the basics of using our proxy platform.',
      category: 'general',
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Understanding our security measures and privacy policies.',
      category: 'security',
    },
    {
      icon: MessageCircle,
      title: 'Technical',
      description: 'Technical details and troubleshooting.',
      category: 'technical',
    },
  ];

  return (
    <section id="help" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Help & Support
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Find answers to common questions and get the help you need.
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </motion.div>

        <div className="flex justify-center mb-8 space-x-2">
          <motion.button
            onClick={() => setActiveCategory(null)}
            className={`px-6 py-2 rounded-full ${!activeCategory ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All
          </motion.button>
          
          {helpCategories.map((category) => (
            <motion.button
              key={category.title}
              onClick={() => setActiveCategory(category.category)}
              className={`px-6 py-2 rounded-full ${activeCategory === category.category ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.title}
            </motion.button>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {helpCategories.map((category, index) => (
            <motion.div
              key={category.title}
              className="bg-gray-50 rounded-3xl p-8 hover:bg-gray-100 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => setActiveCategory(category.category)}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-green-400 rounded-2xl flex items-center justify-center mb-6">
                <category.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {category.title}
              </h3>
              <p className="text-gray-600">
                {category.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl overflow-hidden"
              >
                <motion.button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                  whileHover={{ backgroundColor: '#f3f4f6' }}
                >
                  <span className="font-medium text-gray-900">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
        
        <div className="flex justify-center mt-12 space-x-4">
          <motion.button
            onClick={() => setShowContactForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mail className="w-5 h-5" />
            <span>Email Support</span>
          </motion.button>
        </div>
        
        {/* Contact Form Modal */}
        <AnimatePresence>
          {showContactForm && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactForm(false)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Contact Support</h3>
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <form onSubmit={handleContactFormSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={contactForm.name}
                        onChange={handleContactFormChange}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleContactFormChange}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={contactForm.subject}
                        onChange={handleContactFormChange}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={contactForm.description}
                        onChange={handleContactFormChange}
                        required
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Help;