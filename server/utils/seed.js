const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // quiet
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const BorrowTransaction = require('../models/BorrowTransaction');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected.');

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      BookCopy.deleteMany({}),
      BorrowTransaction.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Hashing passwords...');
    const adminPassHash = await bcrypt.hash('Admin@Password123!', 10);
    const studentPassHash = await bcrypt.hash('Student@123', 10);

    // 1. Create Admin
    const adminUser = await User.create({
      name: 'Dr. S. Ramanathan (Chief Librarian)',
      email: 'admin@smartlibrary.edu',
      passwordHash: adminPassHash,
      role: 'admin',
      phone: '+91 98765 43210',
      isActive: true,
    });
    console.log(`[Seed] Created Admin: ${adminUser.email}`);

    // 2. Create 3 Sample Students
    const students = await User.insertMany([
      {
        name: 'Aldrin Deral',
        registerNumber: '721924104026',
        course: 'B.E. CSE',
        department: 'B.E. CSE',
        academicYear: '2024–2028',
        startYear: 2024,
        endYear: 2028,
        email: 'aldrin.deral@college.edu',
        phone: '+91 94433 11223',
        passwordHash: studentPassHash,
        role: 'student',
        isActive: true,
      },
      {
        name: 'Priyadharshini K',
        registerNumber: '721924104045',
        course: 'B.E. ECE',
        department: 'B.E. ECE',
        academicYear: '2024–2028',
        startYear: 2024,
        endYear: 2028,
        email: 'priya.k@college.edu',
        phone: '+91 98421 55667',
        passwordHash: studentPassHash,
        role: 'student',
        isActive: true,
      },
      {
        name: 'Rahul Sharma',
        registerNumber: '721923105012',
        course: 'B.Tech IT',
        department: 'B.Tech IT',
        academicYear: '2023–2027',
        startYear: 2023,
        endYear: 2027,
        email: 'rahul.sharma@college.edu',
        phone: '+91 97890 33445',
        passwordHash: studentPassHash,
        role: 'student',
        isActive: true,
      },
    ]);
    console.log(`[Seed] Created ${students.length} students.`);

    // 3. Create at least 10 Book Titles
    const booksData = [
      {
        bookTitleId: 'TITLE001',
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
        isbn: '978-0262033848',
        publisher: 'MIT Press',
        edition: '3rd Edition',
        category: 'Computer Science',
        description: 'Comprehensive textbook covering data structures and modern algorithmic foundations.',
      },
      {
        bookTitleId: 'TITLE002',
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
        isbn: '978-1118063330',
        publisher: 'Wiley',
        edition: '10th Edition',
        category: 'Computer Science',
        description: 'Foundational concepts of modern operating systems, processes, concurrency, and virtual memory.',
      },
      {
        bookTitleId: 'TITLE003',
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
        isbn: '978-0078022159',
        publisher: 'McGraw-Hill Education',
        edition: '7th Edition',
        category: 'Database Systems',
        description: 'Covers relational algebra, SQL, transactions, indexing, and distributed databases.',
      },
      {
        bookTitleId: 'TITLE004',
        title: 'Computer Networks: A Systems Approach',
        author: 'Larry L. Peterson, Bruce S. Davie',
        isbn: '978-0123850591',
        publisher: 'Morgan Kaufmann',
        edition: '5th Edition',
        category: 'Computer Networks',
        description: 'Explains networking architectures, packet routing, transport protocols, and wireless systems.',
      },
      {
        bookTitleId: 'TITLE005',
        title: 'Artificial Intelligence: A Modern Approach',
        author: 'Stuart Russell, Peter Norvig',
        isbn: '978-0134610993',
        publisher: 'Pearson',
        edition: '4th Edition',
        category: 'Artificial Intelligence',
        description: 'The standard authoritative text in AI, heuristics, search, logic, and machine learning.',
      },
      {
        bookTitleId: 'TITLE006',
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        publisher: 'Prentice Hall',
        edition: '1st Edition',
        category: 'Software Engineering',
        description: 'Principles, patterns, and best practices for writing clean, maintainable software.',
      },
      {
        bookTitleId: 'TITLE007',
        title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
        isbn: '978-0201633610',
        publisher: 'Addison-Wesley',
        edition: '1st Edition',
        category: 'Software Engineering',
        description: 'Classic Gang of Four reference covering creational, structural, and behavioral patterns.',
      },
      {
        bookTitleId: 'TITLE008',
        title: 'Digital Design and Computer Architecture',
        author: 'David Harris, Sarah Harris',
        isbn: '978-0123944245',
        publisher: 'Morgan Kaufmann',
        edition: '2nd Edition',
        category: 'Electronics & Hardware',
        description: 'From digital logic gates to microarchitecture and RISC instruction sets.',
      },
      {
        bookTitleId: 'TITLE009',
        title: 'Signals and Systems',
        author: 'Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab',
        isbn: '978-0138147570',
        publisher: 'Prentice Hall',
        edition: '2nd Edition',
        category: 'Electronics & Hardware',
        description: 'Comprehensive treatment of continuous and discrete-time signals, Fourier and Laplace transforms.',
      },
      {
        bookTitleId: 'TITLE010',
        title: 'Deep Learning',
        author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
        isbn: '978-0262035613',
        publisher: 'MIT Press',
        edition: '1st Edition',
        category: 'Artificial Intelligence',
        description: 'Deep neural networks, backpropagation, convolutional networks, and generative models.',
      },
    ];

    const createdBooks = await Book.insertMany(booksData);
    console.log(`[Seed] Created ${createdBooks.length} book titles.`);

    // 4. Create at least 15 Physical Book Copies with shelf locations
    const copiesData = [
      // Title 1 (Algorithms) - 3 copies
      {
        copyId: 'COPY001',
        book: createdBooks[0]._id,
        qrCodeValue: 'BOOK_COPY:COPY001',
        shelfBlock: 'Block A',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 01',
        status: 'Issued', // Will be linked to Aldrin
      },
      {
        copyId: 'COPY002',
        book: createdBooks[0]._id,
        qrCodeValue: 'BOOK_COPY:COPY002',
        shelfBlock: 'Block A',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 01',
        status: 'Available',
      },
      {
        copyId: 'COPY003',
        book: createdBooks[0]._id,
        qrCodeValue: 'BOOK_COPY:COPY003',
        shelfBlock: 'Block A',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 02',
        status: 'Available',
      },

      // Title 2 (Operating Systems) - 2 copies
      {
        copyId: 'COPY004',
        book: createdBooks[1]._id,
        qrCodeValue: 'BOOK_COPY:COPY004',
        shelfBlock: 'Block A',
        shelfNumber: 'Shelf 02',
        rackNumber: 'Rack 01',
        status: 'Issued', // Will be linked to Priya
      },
      {
        copyId: 'COPY005',
        book: createdBooks[1]._id,
        qrCodeValue: 'BOOK_COPY:COPY005',
        shelfBlock: 'Block A',
        shelfNumber: 'Shelf 02',
        rackNumber: 'Rack 02',
        status: 'Available',
      },

      // Title 3 (Database Systems) - 2 copies
      {
        copyId: 'COPY006',
        book: createdBooks[2]._id,
        qrCodeValue: 'BOOK_COPY:COPY006',
        shelfBlock: 'Block B',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 01',
        status: 'Available',
      },
      {
        copyId: 'COPY007',
        book: createdBooks[2]._id,
        qrCodeValue: 'BOOK_COPY:COPY007',
        shelfBlock: 'Block B',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 02',
        status: 'Available',
      },

      // Title 4 (Computer Networks) - 2 copies
      {
        copyId: 'COPY008',
        book: createdBooks[3]._id,
        qrCodeValue: 'BOOK_COPY:COPY008',
        shelfBlock: 'Block B',
        shelfNumber: 'Shelf 02',
        rackNumber: 'Rack 01',
        status: 'Issued', // Will be linked to Rahul (Overdue)
      },
      {
        copyId: 'COPY009',
        book: createdBooks[3]._id,
        qrCodeValue: 'BOOK_COPY:COPY009',
        shelfBlock: 'Block B',
        shelfNumber: 'Shelf 02',
        rackNumber: 'Rack 02',
        status: 'Available',
      },

      // Title 5 (AI Modern Approach) - 2 copies
      {
        copyId: 'COPY010',
        book: createdBooks[4]._id,
        qrCodeValue: 'BOOK_COPY:COPY010',
        shelfBlock: 'Block C',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 01',
        status: 'Available',
      },
      {
        copyId: 'COPY011',
        book: createdBooks[4]._id,
        qrCodeValue: 'BOOK_COPY:COPY011',
        shelfBlock: 'Block C',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 02',
        status: 'Available',
      },

      // Title 6 (Clean Code) - 2 copies
      {
        copyId: 'COPY012',
        book: createdBooks[5]._id,
        qrCodeValue: 'BOOK_COPY:COPY012',
        shelfBlock: 'Block C',
        shelfNumber: 'Shelf 02',
        rackNumber: 'Rack 01',
        status: 'Available',
      },
      {
        copyId: 'COPY013',
        book: createdBooks[5]._id,
        qrCodeValue: 'BOOK_COPY:COPY013',
        shelfBlock: 'Block C',
        shelfNumber: 'Shelf 02',
        rackNumber: 'Rack 02',
        status: 'Available',
      },

      // Title 7 (Design Patterns) - 1 copy
      {
        copyId: 'COPY014',
        book: createdBooks[6]._id,
        qrCodeValue: 'BOOK_COPY:COPY014',
        shelfBlock: 'Block D',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 01',
        status: 'Available',
      },

      // Title 8 (Digital Design) - 1 copy
      {
        copyId: 'COPY015',
        book: createdBooks[7]._id,
        qrCodeValue: 'BOOK_COPY:COPY015',
        shelfBlock: 'Block D',
        shelfNumber: 'Shelf 02',
        rackNumber: 'Rack 01',
        status: 'Available',
      },

      // Title 9 (Signals & Systems) - 1 copy
      {
        copyId: 'COPY016',
        book: createdBooks[8]._id,
        qrCodeValue: 'BOOK_COPY:COPY016',
        shelfBlock: 'Block E',
        shelfNumber: 'Shelf 01',
        rackNumber: 'Rack 01',
        status: 'Available',
      },

      // Title 10 (Deep Learning) - 1 copy
      {
        copyId: 'COPY017',
        book: createdBooks[9]._id,
        qrCodeValue: 'BOOK_COPY:COPY017',
        shelfBlock: 'Block E',
        shelfNumber: 'Shelf 02',
        rackNumber: 'Rack 01',
        status: 'Available',
      },
    ];

    const createdCopies = await BookCopy.insertMany(copiesData);
    console.log(`[Seed] Created ${createdCopies.length} physical copies across multiple blocks and shelves.`);

    // 5. Create Sample Transactions
    const now = new Date();

    // Transaction 1: Active borrow for Aldrin Deral (Due in 3 days)
    const issueDate1 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const dueDate1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const tx1 = await BorrowTransaction.create({
      student: students[0]._id, // Aldrin
      book: createdBooks[0]._id, // Algorithms
      bookCopy: createdCopies[0]._id, // COPY001
      issueDate: issueDate1,
      dueDate: dueDate1,
      status: 'Issued',
      issuedBy: adminUser._id,
      remarks: 'Issued at Counter A',
    });

    // Transaction 2: Active borrow for Priya (Due in 7 days)
    const issueDate2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const dueDate2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tx2 = await BorrowTransaction.create({
      student: students[1]._id, // Priya
      book: createdBooks[1]._id, // Operating Systems
      bookCopy: createdCopies[3]._id, // COPY004
      issueDate: issueDate2,
      dueDate: dueDate2,
      status: 'Issued',
      issuedBy: adminUser._id,
      remarks: 'Issued for semester project',
    });

    // Transaction 3: Overdue borrow for Rahul (Due 2 days ago)
    const issueDate3 = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000);
    const dueDate3 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const tx3 = await BorrowTransaction.create({
      student: students[2]._id, // Rahul
      book: createdBooks[3]._id, // Networks
      bookCopy: createdCopies[7]._id, // COPY008
      issueDate: issueDate3,
      dueDate: dueDate3,
      status: 'Overdue',
      issuedBy: adminUser._id,
      remarks: 'Overdue book',
    });

    // Transaction 4: Returned transaction for Aldrin (Historical record)
    const issueDate4 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dueDate4 = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000);
    const returnDate4 = new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000);

    const tx4 = await BorrowTransaction.create({
      student: students[0]._id, // Aldrin
      book: createdBooks[4]._id, // AI Modern Approach
      bookCopy: createdCopies[9]._id, // COPY010 (now available)
      issueDate: issueDate4,
      dueDate: dueDate4,
      returnDate: returnDate4,
      status: 'Returned',
      issuedBy: adminUser._id,
      returnedBy: adminUser._id,
      remarks: 'Returned in good condition',
    });

    console.log('[Seed] Created sample active and historical borrow transactions.');

    // 6. Create Sample In-App Notifications
    await Notification.insertMany([
      {
        student: students[0]._id,
        transaction: tx1._id,
        type: 'INFO',
        title: 'Book Issued Successfully',
        message: "Your book 'Introduction to Algorithms' (Copy: COPY001) has been issued. Due date is in 3 days. Shelf: Block A, Shelf 01.",
        isRead: true,
        reminderKey: `${tx1._id}_ISSUED`,
      },
      {
        student: students[0]._id,
        transaction: tx1._id,
        type: 'REMINDER_DUE_SOON',
        title: 'Book Due in 3 Days',
        message: "Your book 'Introduction to Algorithms' is due in 3 days. Please return or renew on time.",
        isRead: false,
        reminderKey: `${tx1._id}_DUE_3_DAYS`,
      },
      {
        student: students[0]._id,
        transaction: tx4._id,
        type: 'RETURN_CONFIRMATION',
        title: 'Book Returned Successfully',
        message: "Your book 'Artificial Intelligence: A Modern Approach' has been returned successfully.",
        isRead: true,
        reminderKey: `${tx4._id}_RETURNED`,
      },
      {
        student: students[1]._id,
        transaction: tx2._id,
        type: 'INFO',
        title: 'Book Issued Successfully',
        message: "Your book 'Operating System Concepts' (Copy: COPY004) has been issued. Due date is in 7 days.",
        isRead: false,
        reminderKey: `${tx2._id}_ISSUED`,
      },
      {
        student: students[2]._id,
        transaction: tx3._id,
        type: 'OVERDUE',
        title: 'Book Overdue Alert',
        message: "Your book 'Computer Networks: A Systems Approach' is overdue by 2 days. Please return it as soon as possible.",
        isRead: false,
        reminderKey: `${tx3._id}_OVERDUE_2_DAYS`,
      },
    ]);

    console.log('[Seed] Created sample notifications.');

    console.log('\n======================================================');
    console.log(' SEED COMPLETED SUCCESSFULLY');
    console.log('======================================================');
    console.log(' DEMO CREDENTIALS:');
    console.log(' ----------------------------------------------------');
    console.log(' Admin Portal Login:');
    console.log('   Email:    admin@smartlibrary.edu');
    console.log('   Password: Admin@Password123!');
    console.log(' ----------------------------------------------------');
    console.log(' Student Portal Login (Sample Student 1):');
    console.log('   Reg No:   721924104026');
    console.log('   Email:    aldrin.deral@college.edu');
    console.log('   Password: Student@123');
    console.log(' ----------------------------------------------------');
    console.log(' Student Portal Login (Sample Student 2 - Priya):');
    console.log('   Reg No:   721924104045');
    console.log('   Email:    priya.k@college.edu');
    console.log('   Password: Student@123');
    console.log(' ----------------------------------------------------');
    console.log(' Student Portal Login (Sample Student 3 - Rahul Overdue):');
    console.log('   Reg No:   721923105012');
    console.log('   Email:    rahul.sharma@college.edu');
    console.log('   Password: Student@123');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    process.exit(1);
  }
};

seedData();

